import { DocumentData, Timestamp } from "firebase-admin/firestore";
import { db } from "..";
import { logger } from "firebase-functions";

async function upload(collection: string, id: string, data: DocumentData) {
  await db.collection(collection).doc(id).set(data);
}

export async function uploadMockData() {
  const data = {
    applicationForms: [
      {
        id: "sample-form",
        description: "A sample form for testing",
        dueDate: Timestamp.fromDate(new Date()),
        isActive: false,
        semester: "Fall 2025",
        sections: [
          {
            sectionId: "section-1",
            questions: [
              {
                questionType: "short-answer",
                optional: false,
                questionId: "q1",
                questionText: "A simple question",
                secondaryText: "Secondary text...",
              },
              {
                questionType: "long-answer",
                optional: true,
                questionId: "q2",
                questionText: "Another simple question",
                placeholderText: "foo",
                minimumWordCount: 100,
                maximumWordCount: 500,
              },
              {
                multipleSelect: true,
                optional: false,
                questionId: "q3",
                questionText: "Multiple Selection",
                questionOptions: ["Option 1", "Option 2", "Option 3"],
                questionType: "multiple-select",
                secondaryText: "Some secondary text...",
              },
            ],
            sectionName: "Section 1",
          },
          {
            sectionId: "section-2",
            questions: [
              {
                questionType: "short-answer",
                optional: true,
                questionId: "s2q1",
                questionText: "A simple question",
                secondaryText: "Secondary text...",
              },
            ],
            sectionName: "Section 2",
          },
        ],
      },
      {
        id: "sample-form2",
        description: "A sample form for testing",
        dueDate: Timestamp.fromDate(new Date()),
        isActive: false,
        semester: "Spring 2025",
        sections: [
          {
            sectionId: "section-1",
            questions: [
              {
                questionType: "short-answer",
                optional: false,
                questionId: "q1",
                questionText: "A simple question",
                secondaryText: "Secondary text...",
              },
              {
                questionType: "long-answer",
                optional: true,
                questionId: "q2",
                questionText: "Another simple question",
                placeholderText: "foo",
                minimumWordCount: 100,
                maximumWordCount: 500,
              },
              {
                multipleSelect: true,
                optional: false,
                questionId: "q3",
                questionText: "Multiple Selection",
                questionOptions: ["Option 1", "Option 2", "Option 3"],
                questionType: "multiple-select",
                secondaryText: "Some secondary text...",
              },
            ],
            sectionName: "Section 1",
          },
          {
            sectionId: "section-2",
            questions: [
              {
                questionType: "short-answer",
                optional: true,
                questionId: "s2q1",
                questionText: "A simple question",
                secondaryText: "Secondary text...",
              },
            ],
            sectionName: "Section 2",
          },
        ],
      },
      {
        id: "40dffafc-8c70-40e8-afd1-c2b8e82cb403",
        description: "A new sample form for testing",
        dueDate: Timestamp.fromDate(new Date(2026, 0, 0, 0, 0, 0, 0)),
        isActive: true,
        semester: "Fall 2025",
        sections: [
          {
            questions: [
              {
                questionType: "short-answer",
                optional: false,
                questionId: "q1",
                questionText: "A simple question",
                secondaryText: "Secondary text...",
              },
              {
                questionType: "long-answer",
                optional: true,
                questionId: "q2",
                questionText: "Another simple question",
                placeholderText: "foo",
                minimumWordCount: 100,
                maximumWordCount: 500,
              },
              {
                multipleSelect: true,
                optional: false,
                questionId: "q3",
                questionText: "Multiple Selection",
                questionOptions: ["Option 1", "Option 2", "Option 3"],
                questionType: "multiple-select",
                secondaryText: "Some secondary text...",
              },
              {
                questionId: "q4",
                optional: false,
                questionText: "Select a role",
                roleSections: {
                  bootcamp: "role-bc",
                  sourcing: "role-source",
                  "tech-lead": "role-tl",
                  engineer: "role-engineer",
                  designer: "role-design",
                  product: "role-product",
                },
              },
            ],
            sectionName: "Section 1",
            sectionId: "section-1",
          },
          {
            sectionId: "role-bc",
            sectionName: "Bootcamp Section",
            questions: [],
            forRoles: ["bootcamp"],
          },
          {
            sectionId: "role-source",
            sectionName: "Sourcing Section",
            questions: [],
            forRoles: ["sourcing"],
          },
          {
            sectionId: "role-tl",
            sectionName: "Tech Lead Section",
            questions: [],
            forRoles: ["tech-lead"],
          },
          {
            sectionId: "role-engineer",
            sectionName: "Engineer Section",
            questions: [],
            forRoles: ["engineer"],
          },
          {
            sectionId: "role-design",
            sectionName: "Design Section",
            questions: [],
            forRoles: ["designer"],
          },
          {
            sectionId: "role-product",
            sectionName: "Product Section",
            questions: [],
            forRoles: ["product"],
          },
        ],
      },
    ],

    applicationResponses: [
      {
        id: "response-sample-001",
        userId: "SXzRpAtLlgCngTmvfaYCXlZYgyDn",
        applicationFormId: "sample-form",
        applicationResponseId: "response-sample-001",
        rolesApplied: ["engineer", "designer"],
        sectionResponses: [
          {
            sectionName: "Section 1",
            questions: [
              {
                questionType: "short-answer",
                applicationFormId: "sample-form",
                questionId: "q1",
                response: "This is my answer to the short question.",
              },
              {
                questionType: "long-answer",
                applicationFormId: "sample-form",
                questionId: "q2",
                response:
                  "This is a long-form response that has more than one hundred words. Imagine this goes on and meets the minimum and maximum word count requirements.",
              },
              {
                questionType: "multiple-select",
                applicationFormId: "sample-form",
                questionId: "q3",
                response: ["Option 1", "Option 3"],
              },
            ],
          },
        ],
        status: "inactive",
        dateSubmitted: "",
        decisionLetterId: "",
      },
      {
        id: "response-sample-002",
        userId: "SXzRpAtLlgCngTmvfaYCXlZYgyDn",
        applicationFormId: "sample-form",
        applicationResponseId: "response-sample-001",
        rolesApplied: ["engineer", "designer"],
        sectionResponses: [
          {
            sectionName: "Section 1",
            questions: [
              {
                questionType: "short-answer",
                applicationFormId: "sample-form",
                questionId: "q1",
                response: "This is my answer to the short question.",
              },
              {
                questionType: "long-answer",
                applicationFormId: "sample-form",
                questionId: "q2",
                response:
                  "This is a long-form response that has more than one hundred words. Imagine this goes on and meets the minimum and maximum word count requirements.",
              },
              {
                questionType: "multiple-select",
                applicationFormId: "sample-form",
                questionId: "q3",
                response: ["Option 1", "Option 3"],
              },
            ],
          },
        ],
        status: "inactive",
        dateSubmitted: "",
        decisionLetterId: "",
      },
      {
        id: "response-sample-003",
        userId: "SXzRpAtLlgCngTmvfaYCXlZYgyDn",
        applicationFormId: "sample-form2",
        applicationResponseId: "response-sample-001",
        rolesApplied: ["engineer", "designer"],
        sectionResponses: [
          {
            sectionName: "Section 1",
            questions: [
              {
                questionType: "short-answer",
                applicationFormId: "sample-form",
                questionId: "q1",
                response: "This is my answer to the short question.",
              },
              {
                questionType: "long-answer",
                applicationFormId: "sample-form",
                questionId: "q2",
                response:
                  "This is a long-form response that has more than one hundred words. Imagine this goes on and meets the minimum and maximum word count requirements.",
              },
              {
                questionType: "multiple-select",
                applicationFormId: "sample-form",
                questionId: "q3",
                response: ["Option 1", "Option 3"],
              },
            ],
          },
        ],
        status: "inactive",
        dateSubmitted: "",
        decisionLetterId: "",
      },
    ],
  };

  logger.info("Writing mock form to database...");
  await upload(
    "application-forms",
    data["applicationForms"][0].id,
    data["applicationForms"][0],
  );
  await upload(
    "application-forms",
    data["applicationForms"][1].id,
    data["applicationForms"][1],
  );
  await upload(
    "application-forms",
    data["applicationForms"][2].id,
    data["applicationForms"][2],
  );
  await upload(
    "application-responses",
    data["applicationResponses"][0].id,
    data["applicationResponses"][0],
  );
  await upload(
    "application-responses",
    data["applicationResponses"][1].id,
    data["applicationResponses"][1],
  );
  logger.info("Done writing mock data!");
}
