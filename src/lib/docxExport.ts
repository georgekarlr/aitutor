import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  BorderStyle,
} from 'docx';
import type { SavedStudyItem, TutorQuestionItem } from '@/types';

/**
 * Generates and triggers download of a .docx file formatted according to specifications:
 * - All quiz / title / topic
 * - All questions and multiple choices
 * - Page break / end section with all the answers & explanations of the quiz
 */
export async function exportStudyItemToDocx(item: SavedStudyItem): Promise<void> {
  const doc = createSingleStudyDocx(item);
  const blob = await Packer.toBlob(doc);
  const safeFilename = `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_quiz.docx`;
  downloadBlob(blob, safeFilename);
}

/**
 * Exports multiple selected study items into a unified .docx study packet
 */
export async function exportMultipleStudyItemsToDocx(
  items: SavedStudyItem[],
  packageName = 'study_vault_quizzes',
): Promise<void> {
  if (items.length === 0) return;
  if (items.length === 1) {
    return exportStudyItemToDocx(items[0]);
  }

  const doc = createMultiStudyDocx(items);
  const blob = await Packer.toBlob(doc);
  const safeFilename = `${packageName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`;
  downloadBlob(blob, safeFilename);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Creates a formatted docx Document for a single quiz / study item
 */
function createSingleStudyDocx(item: SavedStudyItem): Document {
  const paragraphs: Paragraph[] = [];

  // Main Document Header
  paragraphs.push(
    new Paragraph({
      text: item.title || 'AI Tutor Quiz & Study Set',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `Topic: ${item.topic}  |  Format: ${item.mode.toUpperCase()}  |  Total Items: ${item.questions.length}`,
          italics: true,
          color: '555555',
          size: 20, // 10pt
        }),
      ],
    }),
  );

  if (item.description) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: item.description,
            italics: true,
            color: '666666',
          }),
        ],
      }),
    );
  }

  // Section 1: Questions & Multiple Choices
  paragraphs.push(
    new Paragraph({
      text: 'QUESTIONS',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 200 },
    }),
  );

  item.questions.forEach((q: TutorQuestionItem, index: number) => {
    // Question title
    paragraphs.push(
      new Paragraph({
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: `${index + 1}. `,
            bold: true,
            size: 24, // 12pt
          }),
          new TextRun({
            text: q.question,
            bold: true,
            size: 24,
          }),
          ...(q.points
            ? [
                new TextRun({
                  text: `  (${q.points} pts)`,
                  italics: true,
                  color: '888888',
                  size: 20,
                }),
              ]
            : []),
        ],
      }),
    );

    // Options (Multiple choice options)
    if (q.options && q.options.length > 0) {
      q.options.forEach((opt: string, optIdx: number) => {
        const optionPrefix = getOptionPrefix(opt, optIdx);
        const cleanOptionText = cleanOptionString(opt);

        paragraphs.push(
          new Paragraph({
            indent: { left: 720 }, // 0.5 inch indent
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: `${optionPrefix} `,
                bold: true,
                color: '333333',
              }),
              new TextRun({
                text: cleanOptionText,
                color: '222222',
              }),
            ],
          }),
        );
      });
    } else {
      // Freeform line for answering
      paragraphs.push(
        new Paragraph({
          indent: { left: 720 },
          spacing: { before: 120, after: 120 },
          children: [
            new TextRun({
              text: 'Answer: ____________________________________________________',
              color: '999999',
            }),
          ],
        }),
      );
    }
  });

  // End of page / Page break for Answer Key
  paragraphs.push(
    new Paragraph({
      children: [new PageBreak()],
    }),
  );

  // Section 2: Answer Key and Explanations
  paragraphs.push(
    new Paragraph({
      text: 'ANSWER KEY & EXPLANATIONS',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 300 },
      border: {
        bottom: {
          color: '444444',
          space: 8,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: `Comprehensive Answers for: ${item.title} (${item.topic})`,
          italics: true,
          color: '555555',
          size: 20,
        }),
      ],
    }),
  );

  item.questions.forEach((q: TutorQuestionItem, index: number) => {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({
            text: `${index + 1}. Question: `,
            bold: true,
            color: '444444',
          }),
          new TextRun({
            text: q.question,
            color: '333333',
          }),
        ],
      }),
      new Paragraph({
        indent: { left: 360 },
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({
            text: '✔ Correct Answer: ',
            bold: true,
            color: '008000',
          }),
          new TextRun({
            text: q.correctAnswer || 'See explanation',
            bold: true,
            color: '111111',
          }),
        ],
      }),
    );

    if (q.hint) {
      paragraphs.push(
        new Paragraph({
          indent: { left: 360 },
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text: '💡 Hint: ',
              italics: true,
              color: 'B8860B',
            }),
            new TextRun({
              text: q.hint,
              italics: true,
              color: '555555',
            }),
          ],
        }),
      );
    }
  });

  return new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });
}

/**
 * Creates a combined multi-quiz docx document
 */
function createMultiStudyDocx(items: SavedStudyItem[]): Document {
  const paragraphs: Paragraph[] = [];

  // Master Title
  paragraphs.push(
    new Paragraph({
      text: 'AI TUTOR STUDY VAULT & EXAM PACK',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `Total Modules: ${items.length}  |  Generated by AI Tutor`,
          italics: true,
          color: '555555',
          size: 20,
        }),
      ],
    }),
  );

  // Table of Contents Summary
  paragraphs.push(
    new Paragraph({
      text: 'STUDY PACK OVERVIEW',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 150 },
    }),
  );

  items.forEach((item, idx) => {
    paragraphs.push(
      new Paragraph({
        indent: { left: 360 },
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({
            text: `${idx + 1}. ${item.title}`,
            bold: true,
          }),
          new TextRun({
            text: ` (${item.topic} - ${item.questions.length} questions)`,
            color: '666666',
          }),
        ],
      }),
    );
  });

  // Render each quiz's questions
  items.forEach((item, itemIdx) => {
    paragraphs.push(
      new Paragraph({
        children: [new PageBreak()],
      }),
      new Paragraph({
        text: `QUIZ ${itemIdx + 1}: ${item.title.toUpperCase()}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 150 },
      }),
      new Paragraph({
        spacing: { after: 250 },
        children: [
          new TextRun({
            text: `Topic: ${item.topic}  |  Format: ${item.mode.toUpperCase()}  |  Questions: ${item.questions.length}`,
            italics: true,
            color: '666666',
          }),
        ],
      }),
    );

    item.questions.forEach((q, qIdx) => {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({
              text: `${qIdx + 1}. `,
              bold: true,
              size: 24,
            }),
            new TextRun({
              text: q.question,
              bold: true,
              size: 24,
            }),
          ],
        }),
      );

      if (q.options && q.options.length > 0) {
        q.options.forEach((opt, optIdx) => {
          const prefix = getOptionPrefix(opt, optIdx);
          const cleanOpt = cleanOptionString(opt);
          paragraphs.push(
            new Paragraph({
              indent: { left: 720 },
              spacing: { before: 60, after: 60 },
              children: [
                new TextRun({
                  text: `${prefix} `,
                  bold: true,
                }),
                new TextRun({
                  text: cleanOpt,
                }),
              ],
            }),
          );
        });
      }
    });
  });

  // Final Master Answer Key at the end
  paragraphs.push(
    new Paragraph({
      children: [new PageBreak()],
    }),
    new Paragraph({
      text: 'MASTER ANSWER KEY & EXPLANATIONS',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 300 },
    }),
  );

  items.forEach((item, itemIdx) => {
    paragraphs.push(
      new Paragraph({
        text: `ANSWERS FOR QUIZ ${itemIdx + 1}: ${item.title}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 140 },
      }),
    );

    item.questions.forEach((q, qIdx) => {
      paragraphs.push(
        new Paragraph({
          indent: { left: 360 },
          spacing: { before: 80, after: 60 },
          children: [
            new TextRun({
              text: `${qIdx + 1}. Correct Answer: `,
              bold: true,
              color: '008000',
            }),
            new TextRun({
              text: q.correctAnswer || 'See notes',
              bold: true,
            }),
            ...(q.hint
              ? [
                  new TextRun({
                    text: `  (Hint: ${q.hint})`,
                    italics: true,
                    color: '666666',
                  }),
                ]
              : []),
          ],
        }),
      );
    });
  });

  return new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });
}

function getOptionPrefix(option: string, index: number): string {
  const letters = ['A)', 'B)', 'C)', 'D)', 'E)', 'F)'];
  // Check if option already starts with A) or A. or A:
  const match = option.match(/^([A-Fa-f])[.):-]\s*/);
  if (match) {
    return `${match[1].toUpperCase()})`;
  }
  return letters[index] || `${index + 1})`;
}

function cleanOptionString(option: string): string {
  return option.replace(/^[A-Fa-f][.):-]\s*/, '').trim();
}
