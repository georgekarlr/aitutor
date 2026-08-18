import type { KnowledgeGraphNode, KnowledgeGraphEdge, KnowledgeGraphData, ConceptMasteryStatus } from '@/types';

const DB_NAME = 'aitutor_knowledge_graph_db';
const DB_VERSION = 1;
const STORE_NODES = 'concept_nodes';
const STORE_EDGES = 'concept_edges';
const LOCAL_STORAGE_BACKUP_KEY = 'aitutor_kg_backup_v1';

// In-memory cache for fast synchronous access
let memoryCache: KnowledgeGraphData | null = null;
const listeners = new Set<(data: KnowledgeGraphData) => void>();

export function subscribeKnowledgeGraph(listener: (data: KnowledgeGraphData) => void): () => void {
  listeners.add(listener);
  if (memoryCache) {
    listener(memoryCache);
  }
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(data: KnowledgeGraphData) {
  memoryCache = data;
  listeners.forEach((fn) => {
    try {
      fn(data);
    } catch (err) {
      console.error('[KnowledgeGraph] Listener error:', err);
    }
  });
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NODES)) {
        const nodeStore = db.createObjectStore(STORE_NODES, { keyPath: 'id' });
        nodeStore.createIndex('subject', 'subject', { unique: false });
        nodeStore.createIndex('status', 'status', { unique: false });
        nodeStore.createIndex('masteryScore', 'masteryScore', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_EDGES)) {
        const edgeStore = db.createObjectStore(STORE_EDGES, { keyPath: 'id' });
        edgeStore.createIndex('source', 'source', { unique: false });
        edgeStore.createIndex('target', 'target', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Loads the complete knowledge graph data from IndexedDB (or fallback cache)
 */
export async function getKnowledgeGraph(): Promise<KnowledgeGraphData> {
  if (memoryCache) {
    return memoryCache;
  }

  try {
    const db = await openDB();
    const tx = db.transaction([STORE_NODES, STORE_EDGES], 'readonly');
    const nodeStore = tx.objectStore(STORE_NODES);
    const edgeStore = tx.objectStore(STORE_EDGES);

    const [nodes, edges] = await Promise.all([
      new Promise<KnowledgeGraphNode[]>((res, rej) => {
        const req = nodeStore.getAll();
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => rej(req.error);
      }),
      new Promise<KnowledgeGraphEdge[]>((res, rej) => {
        const req = edgeStore.getAll();
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => rej(req.error);
      }),
    ]);

    const data: KnowledgeGraphData = {
      nodes,
      edges,
      updatedAt: Date.now(),
    };

    notifyListeners(data);
    return data;
  } catch (err) {
    console.warn('[KnowledgeGraph] IndexedDB unavailable, using localStorage fallback:', err);
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as KnowledgeGraphData;
        notifyListeners(parsed);
        return parsed;
      }
    } catch {
      // ignore
    }
    const fallback: KnowledgeGraphData = {
      nodes: [],
      edges: [],
      updatedAt: Date.now(),
    };
    notifyListeners(fallback);
    return fallback;
  }
}

/**
 * Clears all nodes and edges from the knowledge graph
 */
export async function clearKnowledgeGraph(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_NODES, STORE_EDGES], 'readwrite');
    tx.objectStore(STORE_NODES).clear();
    tx.objectStore(STORE_EDGES).clear();

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[KnowledgeGraph] Error clearing IndexedDB:', err);
  }

  try {
    localStorage.removeItem(LOCAL_STORAGE_BACKUP_KEY);
  } catch {
    // ignore
  }

  const empty: KnowledgeGraphData = {
    nodes: [],
    edges: [],
    updatedAt: Date.now(),
  };
  notifyListeners(empty);
}

/**
 * Upserts a concept node
 */
export async function saveConceptNode(node: KnowledgeGraphNode): Promise<void> {
  const current = await getKnowledgeGraph();
  const existingIdx = current.nodes.findIndex((n) => n.id === node.id);
  const updatedNodes = [...current.nodes];
  if (existingIdx >= 0) {
    updatedNodes[existingIdx] = node;
  } else {
    updatedNodes.push(node);
  }

  const updatedData: KnowledgeGraphData = {
    ...current,
    nodes: updatedNodes,
    updatedAt: Date.now(),
  };

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NODES, 'readwrite');
    tx.objectStore(STORE_NODES).put(node);
  } catch {
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(updatedData));
  }

  notifyListeners(updatedData);
}

/**
 * Updates or registers mastery for a concept following a quiz or practice question
 */
export async function updateConceptMastery(
  conceptName: string,
  subject = 'General',
  isCorrect: boolean,
  errorTag?: string
): Promise<KnowledgeGraphNode> {
  const current = await getKnowledgeGraph();
  const normalizedId = 'node_' + conceptName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  
  let node = current.nodes.find(
    (n) => n.id === normalizedId || n.name.toLowerCase() === conceptName.toLowerCase()
  );

  const now = Date.now();

  if (!node) {
    // Create new node
    const initialScore = isCorrect ? 0.8 : 0.3;
    node = {
      id: normalizedId,
      name: conceptName,
      subject,
      masteryScore: initialScore,
      status: initialScore >= 0.75 ? 'mastered' : initialScore >= 0.5 ? 'learning' : 'struggling',
      attemptsCount: 1,
      correctCount: isCorrect ? 1 : 0,
      errorTags: errorTag && !isCorrect ? [errorTag] : [],
      lastTestedAt: now,
      createdAt: now,
      updatedAt: now,
    };
  } else {
    // Moving average update: 70% historical + 30% latest outcome
    const targetDelta = isCorrect ? 1.0 : 0.0;
    const newScore = Math.min(1.0, Math.max(0.0, Number((node.masteryScore * 0.7 + targetDelta * 0.3).toFixed(2))));
    
    let status: ConceptMasteryStatus = 'learning';
    if (newScore >= 0.8) {
      status = 'mastered';
    } else if (newScore < 0.5) {
      status = 'struggling';
    }

    const updatedErrors = [...node.errorTags];
    if (errorTag && !isCorrect && !updatedErrors.includes(errorTag)) {
      updatedErrors.push(errorTag);
      if (updatedErrors.length > 5) updatedErrors.shift(); // Keep top 5 recent error tags
    }

    node = {
      ...node,
      masteryScore: newScore,
      status,
      attemptsCount: node.attemptsCount + 1,
      correctCount: isCorrect ? node.correctCount + 1 : node.correctCount,
      errorTags: updatedErrors,
      lastTestedAt: now,
      updatedAt: now,
    };
  }

  await saveConceptNode(node);
  return node;
}

/**
 * Returns concepts requiring urgent remediation (mastery score < 0.65)
 */
export async function getWeakestConcepts(limit = 4): Promise<KnowledgeGraphNode[]> {
  const data = await getKnowledgeGraph();
  return [...data.nodes]
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, limit);
}

/**
 * Links two concepts together in the knowledge graph
 */
export async function linkConcepts(
  sourceId: string,
  targetId: string,
  relation: KnowledgeGraphEdge['relation'] = 'related_to',
  strength = 0.8
): Promise<void> {
  const current = await getKnowledgeGraph();
  const edgeId = `edge_${sourceId}_${targetId}_${relation}`;
  
  const newEdge: KnowledgeGraphEdge = {
    id: edgeId,
    source: sourceId,
    target: targetId,
    relation,
    strength,
  };

  const edges = current.edges.filter((e) => e.id !== edgeId).concat(newEdge);
  const updatedData: KnowledgeGraphData = {
    ...current,
    edges,
    updatedAt: Date.now(),
  };

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_EDGES, 'readwrite');
    tx.objectStore(STORE_EDGES).put(newEdge);
  } catch {
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(updatedData));
  }

  notifyListeners(updatedData);
}

/**
 * Batch registers new concepts and edges discovered during document ingestion or curriculum generation
 */
export async function batchUpsertKnowledgeConcepts(
  concepts: Array<{
    name: string;
    subject: string;
    summary?: string;
    prerequisites?: string[];
    relatedConcepts?: string[];
  }>
): Promise<number> {
  if (!concepts || concepts.length === 0) return 0;
  
  const current = await getKnowledgeGraph();
  const now = Date.now();
  let insertedCount = 0;
  
  const nodesMap = new Map<string, KnowledgeGraphNode>();
  current.nodes.forEach((n) => nodesMap.set(n.id, n));

  const newEdges: KnowledgeGraphEdge[] = [...current.edges];
  const existingEdgeIds = new Set(current.edges.map((e) => e.id));

  for (const c of concepts) {
    if (!c.name || !c.name.trim()) continue;
    const normalizedId = 'node_' + c.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    
    if (!nodesMap.has(normalizedId)) {
      const newNode: KnowledgeGraphNode = {
        id: normalizedId,
        name: c.name.trim(),
        subject: c.subject || 'General',
        masteryScore: 0.5, // neutral starting baseline
        status: 'learning',
        attemptsCount: 0,
        correctCount: 0,
        errorTags: [],
        prerequisites: c.prerequisites,
        relatedConcepts: c.relatedConcepts,
        notes: c.summary,
        createdAt: now,
        updatedAt: now,
      };
      nodesMap.set(normalizedId, newNode);
      insertedCount++;
    }

    // Connect prerequisites
    if (c.prerequisites && Array.isArray(c.prerequisites)) {
      for (const prereq of c.prerequisites) {
        const prereqId = 'node_' + prereq.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const edgeId = `edge_${prereqId}_${normalizedId}_prerequisite_of`;
        if (!existingEdgeIds.has(edgeId)) {
          newEdges.push({
            id: edgeId,
            source: prereqId,
            target: normalizedId,
            relation: 'prerequisite_of',
            strength: 0.85,
          });
          existingEdgeIds.add(edgeId);
        }
      }
    }

    // Connect related concepts
    if (c.relatedConcepts && Array.isArray(c.relatedConcepts)) {
      for (const rel of c.relatedConcepts) {
        const relId = 'node_' + rel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const edgeId = `edge_${normalizedId}_${relId}_related_to`;
        if (!existingEdgeIds.has(edgeId)) {
          newEdges.push({
            id: edgeId,
            source: normalizedId,
            target: relId,
            relation: 'related_to',
            strength: 0.75,
          });
          existingEdgeIds.add(edgeId);
        }
      }
    }
  }

  const updatedNodes = Array.from(nodesMap.values());
  const updatedData: KnowledgeGraphData = {
    nodes: updatedNodes,
    edges: newEdges,
    updatedAt: now,
  };

  try {
    const db = await openDB();
    const tx = db.transaction([STORE_NODES, STORE_EDGES], 'readwrite');
    const nodeStore = tx.objectStore(STORE_NODES);
    const edgeStore = tx.objectStore(STORE_EDGES);

    for (const node of updatedNodes) {
      nodeStore.put(node);
    }
    for (const edge of newEdges) {
      edgeStore.put(edge);
    }
  } catch {
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(updatedData));
  }

  notifyListeners(updatedData);
  return insertedCount;
}

/**
 * Exports knowledge graph as formatted JSON string
 */
export async function exportKnowledgeGraphJson(): Promise<string> {
  const data = await getKnowledgeGraph();
  return JSON.stringify(data, null, 2);
}

/**
 * Resets the knowledge graph to empty clean state
 */
export async function resetKnowledgeGraph(): Promise<void> {
  await clearKnowledgeGraph();
}
