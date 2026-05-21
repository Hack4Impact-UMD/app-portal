import type { RoleReviewRubric } from "@app-portal/shared/types";
import { ApplicantRole } from "@app-portal/shared/constants";

// const formId = "h4i-spring-2026-form-final";

export const APPLICATION_RUBRICS: (formId: string) => RoleReviewRubric[] = (
  formId: string,
) => [
  {
    id: `${formId}-2025-general-rubric`,
    formId: formId,
    roles: [],
    rubricQuestions: [
      {
        scoreKey: "interest-in-club",
        prompt: "Interest in the club",
        description: `1. Applicant has generic responses and puts in the bare minimum into for responses, such as one or two line answers for why they want to join.\n2. Applicant seems to have put in at least some effort into constructing a response to why they want to join, but reasons are vague and unclear.\n3. Applicant has well-written reasons for wanting to join Hack4Impact. Things preventing a 3 from a 4 could be if the applicant’s reasons could be satisfied at other clubs and not mentioning anything Hack4Impact specific.\n4. Applicant has clear and well-written reasons for wanting to join Hack4Impact specifically. Things to look for would be mentioning past projects or information from our website (showing initiative in looking up our website). If they’ve attended one of our past events, that would be a plus as well.`,
        minValue: 1,
        maxValue: 4,
      },
      {
        scoreKey: "social-good",
        prompt: "Interest in social good",
        description: `1. Applicant doesn’t mention the social impact of the club - clearly just wants to use Hack4Impact as a resume booster.\n2. Applicant mentions social impact but reasons are vague and answers to specific social initiatives seem generic and insincere.\n3. Applicant has detailed response to social initiatives and shows passion for doing social good.\n4. Applicant goes above and beyond on social initiatives that they are passionate about. Applicant shows passion about using their abilities to do good in the community, and has shown past initiative in terms of giving back to the community.`,
        minValue: 1,
        maxValue: 4,
      },
    ],
  },
  {
    id: `${formId}-2025-eng-bootcamp-rubric`,
    formId: formId,
    roles: [ApplicantRole.Engineer, ApplicantRole.Bootcamp],
    rubricQuestions: [
      {
        scoreKey: "technical-expertise",
        prompt: "Technical Expertise (Engineer, Bootcamp)",
        description: `1. Applicant does not have any experience with web dev or any relevant web dev projects. Applicant shows little interest in growing and learning as an engineer.\n2. Applicant has somewhat relevant experience, and shows drive and passion in learning and improving.\n3. Applicant has good relevant experience. Something stopping a 3 from a 4 would be no prior experience working on teams.\n4. Applicant has exemplary experience that would translate well to a Hack4Impact team (web dev personal projects, SWE internships). Applicant demonstrates through prior experience that they have worked proficiently on software teams (Agile) as well as exhibit great communication skills through the written application.`,
        minValue: 1,
        maxValue: 4,
      },
    ],
  },
  {
    id: `${formId}-2025-tech-lead-rubric`,
    formId: formId,
    roles: [ApplicantRole.TechLead],
    rubricQuestions: [
      {
        scoreKey: "technical-expertise",
        prompt: "Technical Expertise (Tech Lead)",
        description: `1. Applicant does not earn a 3 or 4 in the engineer criterion.\n2. Applicant is an above average engineer, but may need to be paired with another more experienced tech lead on a team.\n3. Applicant is an exemplary engineer and is ready to take on a larger role. Things stopping a 3 from being a 4 is a lack of in-field experience leading a SWE team.\n4. Applicant has shown exemplary ability in writing and maintaining clean code (through GitHub or previous experience). Applicant has excelled at a similar leadership role on a SWE team previously. Applicant demonstrates understanding of what good code is like and has shown to be able to make good technical decisions on what technical stack to choose.`,
        minValue: 1,
        maxValue: 4,
      },
    ],
  },
  {
    id: `${formId}-2025-designer-rubric`,
    formId: formId,
    roles: [ApplicantRole.Designer],
    rubricQuestions: [
      {
        scoreKey: "technical-expertise",
        prompt: "Technical Expertise (Designers)",
        description: `1. Applicant demonstrates no projects to back up their artistic ability.\n2. Applicant has adequate ability in terms of creating and designing, but designs are not outstanding.\n3. Applicant is creative and has some artistic ability. Things separating a 3 from a 4 would be lack of experience in digital design or lack of clear communication in written responses.\n4. Applicant is creative and has great artistic ability (exemplified through projects / portfolios). Applicant is a great fit, having prior experience using Figma or other Figma-esque tools.`,
        minValue: 1,
        maxValue: 4,
      },
    ],
  },
  {
    id: `${formId}-2025-pm-rubric`,
    formId: formId,
    roles: [ApplicantRole.Product],
    rubricQuestions: [
      {
        scoreKey: "technical-expertise",
        prompt: "Technical Expertise (PMs)",
        description: `1. Applicant does not show that they understand the scope and responsibility of the role of a PM through their responses.\n2. Applicant shows moderate ability in organization and communication - would be able to be a PM only if paired with a more experienced co-PM.\n3. Applicant shows good ability in organization and communication. Things stopping a three from a four could be inexperience with working on a rigorous software development team.\n4. Applicant clearly understands what is needed from a PM, has exemplary communication skills and has proven to be able to work proficiently in software team environments.`,
        minValue: 1,
        maxValue: 4,
      },
    ],
  },
  {
    id: `${formId}-2025-pr-o-rubric`,
    formId: formId,
    roles: [ApplicantRole.OutreachCoord, ApplicantRole.SocialMedia],
    rubricQuestions: [
      {
        scoreKey: "comm-and-writing-skills",
        prompt: "Communication & Writing Skills (PR & O)",
        description: `1. Applicant does not demonstrate the necessary writing and/or communication skills required for a professional setting.\n2. Applicant possesses coherent but non-professional writing skills and/or struggles with communicating openly and effectively.\n3. Applicant makes clear and sound statements/arguments throughout their writing and within their communication. They lack charisma and personality within their communication.\n4. Applicant consistently sounds professional throughout their writing and communication. Maintains a professional level of charisma within their communication.`,
        minValue: 1,
        maxValue: 4,
      },
    ],
  },
  {
    id: `${formId}-2025-outreach-rubric`,
    formId: formId,
    roles: [ApplicantRole.OutreachCoord],
    rubricQuestions: [
      {
        scoreKey: "npo-expertise",
        prompt: "NPO Experience (PR & O — Outreach Coordinator ONLY)",
        description: `1. Applicant does not show that they understand the scope and responsibility of the role of an NPO through their responses.\n2. Applicant has an adequate understanding of NPOs and their function within our society. They have a minimal amount of experience with NPOs.\n3. Applicant has an adequate understanding of NPOs and how they incorporate into Hack4Impacts mission. They have substantial knowledge and experience with NPOs. Little to no hands-on experience with NPOs in their personal lives.\n4. Applicant has an exceptional understanding of NPOs and how they can work in unison with Hack4Impact and our goals. They have a complete understanding of NPOs on all-levels and varied hands-on experience with them in their personal lives.`,
        minValue: 1,
        maxValue: 4,
      },
    ],
  },
  {
    id: `${formId}-2025-social-media-rubric`,
    formId: formId,
    roles: [ApplicantRole.SocialMedia],
    rubricQuestions: [
      {
        scoreKey: "marketing-expertise",
        prompt: "Marketing Expertise (PR & O — Social Media Manager ONLY)",
        description: `1. Applicant has no relevant experience with social media or content creation and provides no clear understanding of the platforms or goals of social media for a club/org.\n2. Applicant has limited experience with social media or content creation. They may have helped run accounts or contributed to posts but do not explain their role clearly.\n3. Applicant has relevant experience managing social media or content for a club/org. They provide some explanation of platforms used and content type.\n4. Applicant has strong, hands-on experience creating and managing social media or video content. They show clear understanding of audience engagement, platform strategy, or brand storytelling.`,
        minValue: 1,
        maxValue: 4,
      },
    ],
  },
  /*
    {
      id: "2025-tech-assessment-rubric",
      formId: FORM_ID,
      roles: [ApplicantRole.Engineer, ApplicantRole.TechLead],
      rubricQuestions: [
        {
          scoreKey: "tech-assessment-functionality",
          prompt: "Functionality",
          description: `1. The code barely functions. Clicking buttons doesn’t do anything.\n2. The code somewhat functions. There may be large errors, such as all artists display at once, but there is some level of functionality.\n3. It is mostly functional with a 1-2 minor errors (usually the artists do not cycle properly).\n4. Code is fully functional. The buttons do what they are supposed to. The artists cycle properly when the buttons clicked. If the cursor is not a pointer when the button is hovered, give a 3.5.`,
          minValue: 1,
          maxValue: 4,
        },
        {
          scoreKey: "tech-assessment-visual",
          prompt: "Visual",
          description: `1. The design is not reflected in the submission. Elements are missing or completely different from the design.\n2. The page looks somewhat like the Figma. Major discrepancies exist in the design, but all features are displayed. Elements may be incorrectly aligned or sized. The key difference between a 2 and a 3 is that a 2 demonstrates that there was a large visual error that was clearly not addressed (such as the arrows being just lines instead of 2D).\n3. Different from the Figma in minor ways (e.g. corners not rounded, colors off). Objects are still oriented correctly on the page. Sizing and spacing should roughly match the Figma. A 3 usually indicates a minor spacing or margin errors, rather than any major error. A 3 can also be given if the components are different sizes for different artists.\n4. Looks almost identical to the Figma design. Colors are correct. Hover interactions and selected buttons look correct. Images are correctly sized. If the sizing is a bit big, and the page has a scrollbar it can still be given a 4 (if the sizing is comically big, maybe put it as a 3. If the top or bottom of the page has no margins, then give a 3.5.`,
          minValue: 1,
          maxValue: 4,
        },
        {
          scoreKey: "tech-assessment-coding-practices",
          prompt: "Coding Practices",
          description: `1. The code is full of bad practices. Lots of hard coding. Solutions are comically overcomplicated.\n2. Values or data are hard coded. Solutions do not take advantage of key React features like state and components. Things to Look Out For: Frequent in-line styling for style that does not change. Frequent use of “position: absolute”.\n3. The code is effective but could be more efficient. Solutions are more complicated than necessary. Code is repeated when not necessary (such as in the CSS for hovering an element). Things that Could Indicate 3: - No usage of props - 1-2 instances of position: absolute - 1-2 instances of in-line styling\n4. The code is minimal to accomplish the required functionality. React states and parameters are used effectively to store and pass down information. The data is handled responsively so that if the data files were to be altered the code would still work perfectly. Things to Look For: - Usage of .map when displaying an artist’s songs - Usage of the modulus operator to cycle between artists. If either of those things are missing, give it a 3.5 instead of a 4.`,
          minValue: 1,
          maxValue: 4,
        },
        {
          scoreKey: "tech-assessment-coding-style",
          prompt: "Coding Style",
          description: `1. The code cannot be understood.\n2. The code is hard to read. There might be weird chains of parentheses or brackets. The class names don’t really make sense.\n3. The code is mostly easy to read. There might be some really long lines or some weird class names, but it’s good for the most part. Things that Could Indicate a 3: - There might be components only containing a few lines (shouldn’t really be a component). - On the other hand, there might not be enough components. Maybe one file is really big and contains too much code to the point where it affects the readability of the code. - There might be some functions which don’t need to be separate functions (such as a function whose only purpose is to setState). - A few bad class names\n4. The code is easy to read. There is good documentation and comments when appropriate. The class names are chosen well. If only a couple class names are chosen badly, give it a 3.5 or 3 depending on how many class names are bad.`,
          minValue: 1,
          maxValue: 4,
        },
      ],
    },
    */
];

export const APPLICATION_INTERVIEW_RUBRICS: (
  formId: string,
) => RoleReviewRubric[] = (formId: string) => [
  {
    id: `${formId}-2025-tech-lead-interview-rubric`,
    formId: formId,
    roles: [ApplicantRole.TechLead],
    rubricQuestions: [
      {
        scoreKey: "interview-leadership",
        prompt: "Leadership and Mentorship",
        description: `1 – Candidate gives no clear examples of mentoring or leadership. Example: Struggles to describe a time they helped another engineer grow.

2 – Candidate has some leadership experience but impact is limited.
     Example: Mentions code reviews but not structured mentorship or coaching.

3 – Candidate shows consistent mentorship and leadership behaviors. Example: Describes guiding another developer or a group of developers through a major project.

4 – Candidate demonstrates a strong leadership philosophy with concrete results. Example: Shares how they built a culture of learning or successfully led a team with concrete results and statistics.
`,
        minValue: 1,
        maxValue: 4,
      },
    ],
  },
  {
    id: `${formId}-2025-general-engineering-interview-rubric`,
    formId: formId,
    roles: [ApplicantRole.Engineer, ApplicantRole.TechLead],
    rubricQuestions: [
      {
        scoreKey: "interview-technical-competency",
        prompt: "Technical Competency",
        description: `1 – Candidate struggles to explain technical work or show ownership (for perhaps a project on their resume).
Example: Cannot clearly describe how their code fits into a larger system.

2 – Candidate demonstrates solid skills within a limited domain.
Example: Talks confidently about implementing features but not about trade-offs or scaling.

3 – Candidate shows strong technical expertise and system-level thinking.
Example: Explains design choices, debugging strategies, and how they ensure performance and reliability.

4 – Candidate demonstrates technical leadership within projects (even if not a TL, but consider more if this is a TL candidate).
Example: Shares how they set coding standards, optimized an architecture, or influenced team-wide best practices.
`,
        minValue: 1,
        maxValue: 4,
      },
      {
        scoreKey: "interview-teamwork",
        prompt: "Teamwork and Collaboration",
        description: `1 – Candidate struggles to describe positive collaboration experiences. Example: Focuses solely on personal contributions without mention of teamwork.

2 – Candidate shows basic collaboration but limited impact.
     Example: Mentions attending standups or participating in reviews but doesn’t highlight teamwork dynamics.

3 – Candidate demonstrates strong collaboration and communication.
     Example: Describes resolving disagreements constructively or documenting decisions for the team.

4 – Candidate goes beyond their role to strengthen team alignment and inclusion.
     Example: Shares how they proactively worked with a teammate, bridged gaps with product/design, or improved team processes.
`,
        minValue: 1,
        maxValue: 4,
      },
      {
        scoreKey: "interview-problem-solving",
        prompt: "Problem Solving and Adaptability",
        description: `1 – Candidate struggles to explain how they handle problems or ambiguity.
     Example: Provides vague answers or waits for direction instead of problem-solving.

2 – Candidate shows ability to solve well-defined problems but limited adaptability.
     Example: Talks about fixing bugs or finishing tasks but not adapting when scope changed.

3 – Candidate demonstrates structured problem-solving and adaptability.
     Example: Explains how they broke down a complex issue into steps or adjusted to shifting requirements.

4 – Candidate thrives in complexity and drives solutions.
     Example: Shares how they proposed a creative workaround to a blocker or led debugging during a critical incident.`,
        minValue: 1,
        maxValue: 4,
      },
    ],
  },
  {
    id: `${formId}-2025-design-interview-rubric`,
    formId: formId,
    roles: [ApplicantRole.Designer],
    rubricQuestions: [
      {
        scoreKey: "interview-design-passion",
        prompt: "Passion for H4I & Social Impact",
        description: `5 – Excellent: Applicant is extremely passionate and deeply committed to social good, provides strong examples of past involvement/passion in design work, and clearly articulates why Hack4Impact’s mission resonates with them.

4 – Strong: Applicant demonstrates strong interest in Hack4Impact, providing one or more examples or a clear motivation for applying design to social good.

3 – Satisfactory: Applicant expresses interest, but their answers are somewhat generic, surface-level, or lack genuine enthusiasm.

2 – Weak: Applicant is vague or uncertain about why social good matters to them. They may mention wanting to join Hack4Impact but do not connect it to their skills or values; their answers lack genuine passion.

1 – Poor: Applicant has little to no interest in H4I’s mission and/or doesn’t mention anything about H4I or why they are excited to be a part of the club.
`,
        minValue: 1,
        maxValue: 5,
      },
      {
        scoreKey: "interview-communication",
        prompt: "Communication and Collaboration",
        description: `5 – Excellent: Applicant explains work clearly, professionally, and confidently; and can tailor their explanations for NPO clients or team members.

4 – Strong: Applicant is mostly clear and confident in their communication, with some minor gaps but overall is a strong communicator.

3 – Satisfactory: Applicant can explain design ideas, but their delivery is unpolished, scattered, or overly technical.

2 – Weak: Applicant has difficulty explaining ideas clearly; relies too much on jargon; and/or shows little awareness of how to adjust communication for their team and/or a nonprofit client.

1 – Poor: Applicant cannot explain work or ideas and is a poor communicator.
`,
        minValue: 1,
        maxValue: 5,
      },
      {
        scoreKey: "interview-design-teamwork",
        prompt: "Teamwork & Collaboration",
        description: `5 – Excellent: Applicant is a strong collaborator, gives specific examples of effective teamwork (especially with devs/PMs/designers); and is self-aware and adaptable.
4 – Strong: Applicant works well with others; provides good examples of experience working in teams; and understands group roles.
3 – Satisfactory: Applicant has some teamwork experience, but their contributions in projects are unclear and/or they don’t provide specific examples of how they collaborated cross-functionally.
2 – Weak: Applicant has limited teamwork skills and experience and prefers working alone. Applicant struggles to describe collaboration style.
1 – Poor: Applicant has no teamwork experience and/or is dismissive of collaboration.
`,
        minValue: 1,
        maxValue: 5,
      },
      {
        scoreKey: "interview-technical-skills",
        prompt: "Design Thinking & Technical Skills",
        description: `5 – Excellent: Applicant demonstrates a structured, thoughtful end-to-end process (e.g., research → ideation → iteration → testing); considers trade-offs and limitations such as technical, business, or team/stakeholder constraints; shows strong UX reasoning, fluent in using design tools, and produces polished work.

4 – Strong: Applicant has a clear process; solid grasp of UX principles; and comfortable with tools like Figma. Applicant shows understanding of design workflow and reasoning; their design process may lack some depth but is clearly structured.

3 – Satisfactory: Applicant has a basic understanding of workflows and some design tool proficiency; their process is described but shallow or incomplete; they demonstrate UX awareness.

2 – Weak: Applicant has an unclear or shallow process; little applied design experience, little sense of structured design thinking.

1 – Poor: Applicant cannot describe their design process or problem-solving approach. Applicant demonstrates no evident design thinking or technical skill, cannot describe their design process or problem-solving approach.
`,
        minValue: 1,
        maxValue: 5,
      },
      {
        scoreKey: "interview-designer-adapt",
        prompt: "Adaptability & Open-Mindedness",
        description: `5 – Excellent: Applicant is highly flexible; integrates feedback gracefully; balances usability with client needs; proactively seeks feedback.

4 – Strong: Applicant is open to feedback and can adapt with some guidance or prompting.

3 – Satisfactory: Applicant is receptive to feedback but may be hesitant or defensive; showing limited indication of valuing others’ perspectives or willingness to compromise.

2 – Weak: Applicant struggles to adapt ideas or may resist differing perspectives.

1 – Poor: Applicant is rigid in thinking and dismissive of feedback.
`,
        minValue: 1,
        maxValue: 5,
      },
    ],
  },
  {
    id: `${formId}-2025-product-interview-rubric`,
    formId: formId,
    roles: [ApplicantRole.Product],
    rubricQuestions: [
      {
        scoreKey: "interview-product-statements",
        prompt: "Problem Statements and Product Vision",
        description: `1 - The applicant struggles to ideate features and empathize with the client. They miss key points of the client’s needs and fail to understand the problem they are being approached with. Overall product vision struggles to come together when developing user flows. They have a hard time talking about feature development and the technical aspects of them.  

2 - The applicant is able to ideate some features while empathizing with the client’s needs. Their features somewhat relate to the needs and kind of address them directly, demonstrating some understanding of the problem. Their overall product vision is a little weak, but holds up by connecting various features together in an okay way. They are able to talk to a few technical aspects of a feature they wish to implement. 

3 - The applicant is able to ideate a majority of features when empathizing with the client’s needs. Their features mostly address the client needs and address them directly, demonstrating a good understanding of the problem. The applicant somewhat considers priorities in what features would have higher overall impact for the NPO. Their overall product vision is strong, connecting various features together in a logical way that would make sense to a user. They speak to a good amount of technical aspects of a feature they wish to implement. 

4 - The applicant is able to ideate most if not all features necessary for the applicant when empathizing with the client’s needs. Their features completely address the client needs and address them directly, demonstrating an advanced understanding of the problem. The applicant strongly considers priorities in what features would have higher overall impact for the NPO. Their overall product vision is very robust, connecting all of their features together in a very logical way that a user would be able to use with ease. They speak to most if not all of the technical aspects of a feature they wish to implement.`,
        minValue: 1,
        maxValue: 4,
      },
      {
        scoreKey: "interview-product-leadership",
        prompt: "Leadership",
        description: `1 -  The applicant struggles to break down the suggested feature into smaller tasks, unable to see where things could become more singular tasks. They have difficulty handling delegation when they do not have an appropriate amount of engineers, unable to find potential alternatives. They do not handle situations well with their engineer, resulting from a poor leadership style. They are unable to identify an off track project and are unable to account for this when building a project roadmap. 

2 - The applicant is somewhat able to break down the suggested feature into smaller tasks, potentially leaving things less broken down than they should be. They have some difficulty handling the delegation, not considering long term sprint planning or other alternatives. They handle the situation with their engineer in an okay way, giving some confidence in their leadership style. They can somewhat identify an off track project, but struggle to account for changes in their roadmap. 

3 - The applicant is able to break down the suggested feature into smaller tasks, leaving few things as small tasks. They think about ways to delegate tasks, considering one possible solution. They are capable of handling an issue with an engineer falling behind, showing leadership skills. They identify an off track project, and can adapt their roadmap to handle mid-semester changes. 

4 - The applicant is very capable of breaking down the suggested feature into smaller tasks, leaving no task or feature with too much content. They have multiple solutions to delegating tasks, considering multiple scenarios the project state is in. They strongly handle an engineer falling behind, leading with empathy but also thinking big picture about the project. They identify an off track project, adapting their roadmap to handle mid-semester changes. 
`,
        minValue: 1,
        maxValue: 4,
      },
      {
        scoreKey: "interview-product-client",
        prompt: "Client Issues",
        description: `1 - The applicant is unable to find a way to appropriately handle scope creep. They either cave to the NPOs' demands, or immediately reject them outright without any consideration. They manage team morale in a very ineffective way, resulting in significant losses to team morale. 

2 - The applicant is somewhat able to find a way to appropriately handle scope creep. They consider both sides, but struggle to make a decision. They manage team morale in a somewhat ineffective way, resulting in some losses to team morale. 

3 - They find a single appropriate way to handle the scope creep. They consider both sides, identifying some elements of scale, engineer capabilities, and timeline. They manage team morale in a somewhat effective manner, resulting in some gains to team morale. 

4 - The applicant finds multiple ways to deal with scope creep in a very appropriate manner, considering multiple scenarios that may be going on with their project to best account for it. They consider both sides, considering all elements of scale, engineer capabilities, and timeline. They manage team morale in a very effective manner, resulting in significant gains to team morale. 
`,
        minValue: 1,
        maxValue: 4,
      },
    ],
  },
  {
    id: `${formId}-2025-general-interview-rubric`,
    formId: formId,
    roles: [
      ApplicantRole.Bootcamp,
      ApplicantRole.OutreachCoord,
      ApplicantRole.SocialMedia,
    ],
    rubricQuestions: [
      {
        scoreKey: "interview-overall",
        prompt: "Overall Score",
        description: ``,
        minValue: 1,
        maxValue: 4,
      },
    ],
  },
];
