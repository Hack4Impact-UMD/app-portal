import { ApplicantRole, QuestionType } from "@app-portal/shared/types";
import type { ApplicationForm } from "@/types/formBuilderTypes";
import { ReviewStatus } from "@/types/types";
import { Timestamp } from "firebase/firestore";

const FORM_ID = "h4i-fall-2025-form-final";

export const h4iApplicationForm: ApplicationForm = {
  id: FORM_ID,
  isActive: true,
  dueDate: Timestamp.fromDate(new Date("2025-08-22T03:59:59Z")),
  semester: "Fall 2025",
  description: `
Hack4Impact is a student-run 501(c)(3) dedicated to building software for social impact. We are the **University of Maryland, College Park chapter** of the national Hack4Impact organization. Each year, we partner with nonprofits to help them better serve their communities. We are recruiting software engineers, product managers, tech leads, UI designers, and sourcing team members for the fall semester.

**We are looking for new members who are:**
* Willing to commit their time for 1 semester (at least 5 hours per week)
* Excited about our mission and values
* Passionate about software, social impact, and our nonprofit partners
* Willing to learn

Extensive experience isn't necessary, but technical applicants should have programming experience. We place a strong emphasis on learning, so we’ll teach you everything you need to know beyond programming fundamentals during Bootcamp!

We have positions open for **Software Engineers, Product Managers (PMs), Tech Leads (TLs), UI/UX Designers and Public Relations & Outreach Team members**. 

**Descriptions for Open Roles**:

*Bootcamp*

Bootcamp essentially teaches members the necessary skillset to join a project team. In bootcamp, students learn web development skills starting from basic HTML, JavaScript, and CSS and then building up to the FERN (Firebase, Express, React, Node.js) stack. The goal is for members to complete bootcamp and then join a project team the following semester. Similar to project teams, we are looking for motivated and committed students to join bootcamp and continue working with our nonprofit partners. The bootcamp workflow involves weekly meetings, doing the assignments during the week, and monthly chapter wide meetings. The time commitment is around 3-5 hours a week.

*Public Relations & Outreach (PR&O)* 

PR&O is Hack4Impact-UMD’s external-facing team, responsible for identifying and securing nonprofit partners, managing organizational communications, and maintaining the org’s public presence. The team includes **Outreach Coordinators**, who lead nonprofit outreach and project sourcing, with optional specialization tracks in finance or long-term growth. It also includes **Social Media Managers**, who create content across platforms like Instagram, TikTok, and YouTube. PR&O is a great fit for students interested in communication, business, social impact, or public policy, and there is no technical background required. The time commitment is around 3-5 hours per week.

*Project Teams*

Project teams work with real non-profit partners, creating solutions for any technical needs that our partners have. It's important to us when forming teams to find people who have the capacity to commit to the project for the whole semester. Otherwise, it's unfair to the teams and the partners. Our project teams practice the agile software development methodology, and project team members are expected to fulfil their commitments made during each sprint. Our workflow involves two week sprints, weekly meetings with your team, doing your own project tasks during the week, and monthly chapter wide meetings. The time commitment is around 5 hours a week.
* **Product Manager (PM)** - The Product Manager is responsible for drawing out the project roadmap, ensuring deadlines are met, meeting weekly with the team, nonprofit, tech leads, designers, and Director of Product to discuss project progression, staying organized in project management, being accountable for decisions, providing accurate updates, communicating professionally with the nonprofit, maintaining structure and effective communication within the team, promoting participation, encouraging interaction, and resolving conflicts effectively.
* **Designer** - The Designer is responsible for creating frontend designs based on nonprofit needs, attending team meetings and meetings with the nonprofit and PM, meeting with the Director of Design to discuss project progression, walking through designs for nonprofit feedback, collaborating with engineers to ensure design feasibility, meeting deadlines to support engineering timelines, and providing feedback on design implementation.
* **Tech Lead** - The Tech Lead serves as the point of contact for engineers regarding project technologies, researches and shapes the project’s technical direction, attends team and nonprofit meetings with the PM, meets weekly with the Director of Engineering, reviews pull requests, documents tasks on the Kanban board before sprint meetings, updates the PM on engineer progress and issues, and advises designers on the feasibility of their designs.
* **Engineer** - The Engineer is responsible for implementing all technological aspects of the product, attending team meetings, completing assigned tasks by the deadline, and updating the Tech Lead and PM with relevant issues.

**Why join?**
* Developing projects for our nonprofit partners as a student is incredible, and recruiters notice
* You’ll find a community of multidisciplinary, passionate people who love what they do
* You can learn more about a role you may want to have after school
* Attend workshops, tech talks, social events, and volunteer events
* Learn about working in the nonprofit sector and tech for social good
* Work with and learn more about some amazing organizations
* Get plugged into a strong network of accomplished and amazing alums

There are also PLENTY of opportunities to gain leadership experience. We have positions for mentors, a super fun board of directors, and even a national board and committees. As an organization and as a community, we care about and actively support the individual development of each member, both professional and personal. When you join Hack4Impact-UMD, you join a national network of leaders, techies, do-gooders, and friends.

Feel free to visit our chapter website at <https://umd.hack4impact.org/> or the national website at <https://hack4impact.org> for more information.

We will have rolling applications that consist of this written application and may include a live interview (not a technical interview). Those applying for the engineer and/or tech lead role are **REQUIRED** to complete a technical assessment (2-3 hours) included in the following sections of this application form. We will be CLOSING the form at **midnight (11:59pm EST) on August 19, 2025** or when openings are filled.

**Please do not use ChatGPT or other AI services to create or edit your responses.**

Please reach out to <umd@hack4impact.org> if you have any questions.

All admission decisions will be communicated to applicants no later than September 1, 2025.
  `,
  decisionsReleased: false,
  decisionLetter: {
    [ReviewStatus.Accepted]: {
      [ApplicantRole.Bootcamp]: `
Thank you for your patience during the application and interview process. *Based on your experience, comments, and our non-profit partners’ needs, we have placed you on the Bootcamp team.* Congratulations!

Our first general body meeting is **Thursday, September 11 from 6-7PM**. Location will be shared soon.
      
In terms of the next steps, please:
      
1. Join our Slack workspace (you'll receive an invite soon) and join the #umd-general, #umd-random, #umd-opportunities, and #umd-socialimpact channels. **Slack will be our main form of communication.**
2. Update your Slack profile to include your preferred name, a profile picture, pronouns, and your email address.
3. Join our org on [Terplink](https://terplink.umd.edu/organization/hack4impact)!
4. Let us know if you are interested in taking on roles related to sourcing nonprofit projects, which would involve contacting different nonprofit organizations and developing projects for us to work on, marketing, or community development.
5. Join us for our **New Member Social on Tuesday, September 9th from 6-7 at TerpZone!** Talk to some new faces and learn a little more about the org!
      
Once again, we’re looking forward to working with you. Let us know if you have any questions.
      `,
      ["team"]: `
Congratulations! Welcome to our organization for Fall 2025! Thank you for your patience during the application and interview process. *Based on your experience, comments, and our non-profit partners’ needs, we have placed you on a project team for this role.* You'll hear more about your project at the first team meeting.

Our first general body meeting is **Thursday, September 11 from 6-7PM**. Location will be shared soon.

In terms of the next steps, please:

1. Join our Slack workspace (you'll receive an invite soon) and join the #umd-general, #umd-random, #umd-opportunities, and #umd-pixels channels. **Slack will be our main form of communication.**
2. Update your Slack profile to include your preferred name, a profile picture, pronouns, and your email address.
3. Join our org on [Terplink](https://terplink.umd.edu/organization/hack4impact)!
4. Join us for our **New Member Social on Tuesday, September 9th from 6-7 at TerpZone!** Talk to some new faces and learn a little more about the org!

Once again, we’re looking forward to working with you. Let us know if you have any questions.
    `,
    },
    [ReviewStatus.Waitlisted]: {
      [ApplicantRole.Bootcamp]: `
Thank you for your patience during the application and interview process. Based on your experience, our openings, and our client’s needs, we have decided to place you on the *waitlist for bootcamp* this semester.

We believe that you would be a great fit for our **bootcamp**. However, this semester, the **bootcamp** spots filled up quickly.
    
If there are any **bootcamp** openings before the waitlist closes, we will notify you and place you in **bootcamp**.
    
If there are no new openings, we will retain your email address and application status for **Spring 2026**, our next recruiting season. We would then send you a form asking for an updated resume and if you are still interested in the same position.
    
**Please indicate your interest in being placed on the waitlist using [this](https://forms.gle/JJ16tAq73mwM7K6s8) form** and feel free to reach out if you have any questions or concerns.
    `,
      ["team"]: `
Thank you for your patience during the application and interview process. Based on your experience, our openings, and our client’s needs, we have decided to place you on the *waitlist for project teams* this semester.

We believe that you would be a great fit for our **project teams**. However, this semester, the **project team** spots filled up quickly.
    
If there are any **project team** openings that align with your role preferences before the waitlist closes, we will notify you and place you in **a project team**.
    
If there are no new openings, we will retain your email address and application status for **Spring 2026**, our next recruiting season. We would then send you a form asking for an updated resume and if you are still interested in the same position.
    
**Please indicate your interest in being placed on the waitlist using [this](https://forms.gle/JJ16tAq73mwM7K6s8) form** and feel free to reach out if you have any questions or concerns.
    `,
    },
    [ReviewStatus.Denied]: `
Thank you for your patience during the application and interview process. Based on your experience, our openings, and our client's needs, we were unable to place you on a project or bootcamp this semester, but we invite you to apply in the future ([here](https://forms.gle/m1uVJ8kPihS6ihCh6) is our Spring 2026 Interest Form). We really appreciate your interest in our organization and mission, and we hope you have a good semester.
    `,
  },
  scoreWeights: {
    [ApplicantRole.Bootcamp]: {
      "interest-in-club": 0.5,
      "social-good": 0.5,
      "technical-expertise": 0, // noted but not weighted
    },
    [ApplicantRole.Engineer]: {
      "technical-expertise": 0.5,
      "interest-in-club": 0.25,
      "social-good": 0.25,
      /*
      "tech-assessment-functionality": 0.3215 / 2,
      "tech-assessment-visual": 0.21875 / 2,
      "tech-assessment-coding-practices": 0.28125 / 2,
      "tech-assessment-coding-style": 0.1875 / 2,
      */
    },
    [ApplicantRole.Designer]: {
      "technical-expertise": 0.5,
      "interest-in-club": 0.25,
      "social-good": 0.25,
    },
    [ApplicantRole.Product]: {
      "technical-expertise": 0.5,
      "interest-in-club": 0.25,
      "social-good": 0.25,
    },
    [ApplicantRole.TechLead]: {
      "technical-expertise": 0.5,
      "interest-in-club": 0.25,
      "social-good": 0.25,
      /*
      "tech-assessment-functionality": 0.3215 / 2,
      "tech-assessment-visual": 0.21875 / 2,
      "tech-assessment-coding-practices": 0.28125 / 2,
      "tech-assessment-coding-style": 0.1875 / 2,
      */
    },
    [ApplicantRole.SocialMedia]: {
      "interest-in-club": 0.3,
      "social-good": 0.3,
      "marketing-expertise": 0.3,
      "comm-and-writing-skills": 0.1,
    },
    [ApplicantRole.OutreachCoord]: {
      "interest-in-club": 0.3,
      "social-good": 0.3,
      "npo-expertise": 0.3,
      "comm-and-writing-skills": 0.1,
    },
  },
  interviewScoreWeights: {
    [ApplicantRole.Bootcamp]: {
      "interview-overall": 1,
    },
    [ApplicantRole.Engineer]: {
      "interview-technical-competency": 0.34,
      "interview-teamwork": 0.33,
      "interview-problem-solving": 0.33,
    },
    [ApplicantRole.Designer]: {
      "interview-design-passion": 0.1,
      "interview-communication": 0.25,
      "interview-design-teamwork": 0.2,
      "interview-technical-skills": 0.3,
      "interview-designer-adapt": 0.15,
    },
    [ApplicantRole.Product]: {
      "interview-product-statements": 0.34,
      "interview-product-leadership": 0.33,
      "interview-product-client": 0.33,
    },
    [ApplicantRole.TechLead]: {
      "interview-technical-competency": 0.25,
      "interview-teamwork": 0.25,
      "interview-problem-solving": 0.25,
      "interview-leadership": 0.25,
    },
    [ApplicantRole.SocialMedia]: {
      "interview-overall": 1,
    },
    [ApplicantRole.OutreachCoord]: {
      "interview-overall": 1,
    },
  },
  sections: [
    {
      sectionId: "basic-info",
      sectionName: "Basic Information",
      description: "Tell us about yourself",
      questions: [
        {
          questionId: "full-name",
          questionType: QuestionType.ShortAnswer,
          optional: false,
          questionText: "Full Name",
          placeholderText: "Enter your full name",
        },
        {
          questionId: "preferred-name",
          questionType: QuestionType.ShortAnswer,
          optional: true,
          questionText: "Preferred Name",
          placeholderText: "What would you like to be called?",
        },
        {
          questionId: "year",
          questionType: QuestionType.MultipleChoice,
          optional: false,
          questionText: "Year",
          questionOptions: [
            "Freshman",
            "Sophomore",
            "Junior",
            "Senior",
            "Graduate Student",
          ],
        },
        {
          questionId: "major",
          questionType: QuestionType.ShortAnswer,
          optional: false,
          questionText: "Major",
          placeholderText: "Your major(s)",
        },
        {
          questionId: "minor",
          questionType: QuestionType.ShortAnswer,
          optional: true,
          questionText: "Minor(s)",
          placeholderText: "Your minor(s) if any",
        },
        {
          questionId: "cs-classes",
          questionType: QuestionType.LongAnswer,
          optional: true,
          questionText: "Which CS classes have you taken?",
          secondaryText: `
CS classes are NOT a requirement for members, we take all majors!

**[You must be a current/incoming student at the University of Maryland, College Park]. Include course numbers and names (e.g., CMSC131, CMSC132, etc.)**`,
          placeholderText: "List the computer science courses you've completed",
          maximumWordCount: 200,
        },
      ],
    },
    {
      sectionId: "demographics",
      sectionName: "Demographic Information",
      hideFromReviewers: true,
      description:
        "Help us understand our community. Your responses will not affect the result of your application, they are purely for metric purposes.",
      questions: [
        {
          questionId: "pronouns",
          questionType: QuestionType.ShortAnswer,
          optional: true,
          questionText: "Pronouns",
          placeholderText: "e.g., she/her, he/him, they/them",
        },
        {
          questionId: "gender",
          questionType: QuestionType.MultipleChoice,
          optional: true,
          questionText: "Gender",
          questionOptions: [
            "Woman",
            "Man",
            "Non-binary",
            "Prefer not to answer",
            "Prefer to self-describe",
          ],
        },
        {
          questionId: "gender-self-describe",
          questionType: QuestionType.ShortAnswer,
          optional: true,
          questionText: "If you chose to self-describe, enter your gender here",
          placeholderText: "",
        },
        {
          questionId: "race-ethnicity",
          questionType: QuestionType.MultipleSelect,
          optional: true,
          questionText: "Racial/Ethnic Groups",
          questionOptions: [
            "American Indian or Alaska Native",
            "Asian",
            "Black or African American",
            "Hispanic or Latino",
            "Native Hawaiian or Other Pacific Islander",
            "White",
            "Prefer not to answer",
            "Prefer to self-describe",
          ],
        },
        {
          questionId: "race-ethnicity-self-describe",
          questionType: QuestionType.ShortAnswer,
          optional: true,
          questionText:
            "If you chose to self-describe, enter your race/ethnicity here",
          placeholderText: "",
        },
      ],
    },
    {
      sectionId: "role-selection",
      sectionName: "Role Selection",
      description: `
**About Hack4Impact-UMD Teams & Structure**

At Hack4Impact-UMD, there are three types of teams: project teams, bootcamp, and the sourcing team. Project teams work directly with our nonprofit partners to create products to help the community; these teams consists of 🤝 Product Managers (PMs), 🤖 Tech Leads, 🎨 Designers, and ⚙️ Engineers. On the other hand, bootcamp is for students who are interested in Hack4Impact's mission but need experience before they join a project team. The sourcing team reaches out to non-profit organizations to secure projects for Hack4Impact-UMD. 

**🫂 Project Teams**

Project teams work with real non-profit partners, creating solutions for any technical needs that our partners have. It's important to us when forming teams to find people who have the capacity to commit to the project for the whole semester. Otherwise, it's unfair to the teams and the partners. Our project teams practice the agile software development methodology, and project team members are expected to fulfil their commitments made during each sprint. Our workflow involves two week sprints, weekly meetings with your team, doing your own project tasks during the week, and monthly chapter wide meetings. The time commitment is around 5 hours a week.

**🥾 Bootcamp**

Bootcamp essentially teaches members the necessary skillset to join a project team. Students will learn web development skills starting from basic HTML, JavaScript, and CSS, and then build up to more complicated tools like Firebase, React, and Node.js. The goal is for members to complete bootcamp and then have the necessary skills to pass a technical assessment and join a project team the following semester. The bootcamp is mainly focused on developing technical skills, but there are opportunities to learn about other roles including Designer and Project Manager. Similar to project teams, we are looking for motivated and committed students to join bootcamp and continue working with our nonprofit partners. The bootcamp workflow involves weekly meetings, doing the assignments during the week, and monthly chapter wide meetings. The time commitment is around 3-7 hours a week.

**🗣️ Public Relations & Outreach Team**

Public Relations & Outreach (PR&O) is Hack4Impact-UMD’s external-facing team, responsible for identifying and securing nonprofit partners, managing organizational communications, and maintaining the org’s public presence. The team includes **📢 Outreach Coordinators**, who lead nonprofit outreach and project sourcing, with optional specialization tracks in finance or long-term growth. It also includes **📱 Social Media Managers**, who create content across platforms like Instagram, TikTok, and YouTube. PR&O is a great fit for students interested in communication, business, social impact, or public policy, and there is no technical background required. The time commitment is around 3-5 hours per week.

**Member Responsibilities**

Regardless of which team a Hack4Impact-UMD member is in, there are responsibilities that we expect all members to follow:

- attend mandatory general body meetings
- attend team, bootcamp, or sourcing meetings
- respond to Slack messages within 24 to 48 hours
- regularly check team Slack channel and #umd-general for announcements

There are additional responsibilities depending on the member's role and team.
`,
      questions: [
        {
          questionId: "role-select",
          questionType: QuestionType.RoleSelect,
          optional: false,
          questionText: "Which role(s) are you applying for?",
          secondaryText: `
You can choose which roles to apply to here! You are free to apply to as many roles as you want!
`,
        },
      ],
    },
    {
      sectionId: "general-questions",
      sectionName: "General Questions",
      description: "Questions for all applicants",
      questions: [
        {
          questionId: "technical-skills",
          questionType: QuestionType.MultipleSelect,
          optional: false,
          questionText: "Technical Skills Checklist",
          secondaryText: `
We consider applicants with all experience levels! You are not required to have technical experience, just a willingness to learn. People with fewer technical skills, but sufficient interest and passion, may be placed on a bootcamp group. If you don't have any of these yet, don't worry (especially if you're interested in sourcing). Please only check the following skills that you have used for a project (in class, internship, research, or for fun).
`,
          questionOptions: [
            "HTML/CSS",
            "JavaScript",
            "React",
            "Node.js",
            "Python",
            "Java",
            "C++",
            "Git/GitHub",
            "SQL/Databases",
            "UI/UX Design",
            "Figma",
            "Adobe Creative Suite",
            "Project Management",
            "None of the above",
          ],
        },
        {
          questionId: "resume",
          questionType: QuestionType.FileUpload,
          optional: false,
          questionText: "Resume Upload",
          secondaryText: "Upload your current resume (PDF format preferred)",
          fileId: "resume",
        },
        {
          questionId: "why-h4i",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "What about Hack4Impact-UMD drove you to apply, and what makes us stand out to you?",
          secondaryText:
            "We are looking for a detailed and thoughtful answer here. Aim for a response of at least 400 words that gives a clear sense of why you're excited to join Hack4Impact-UMD, and how we align with your values and goals.",
          placeholderText: "Tell us what attracted you to our organization...",
          minimumWordCount: 400,
        },
        {
          questionId: "social-initiative",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "Tell us about a social initiative you're interested in. How would you use your technical abilities to help?",
          placeholderText:
            "Describe a cause you care about and how technology could make a difference...",
          maximumWordCount: 300,
        },
        {
          questionId: "community-giveback",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText: "How have you given back to the community recently?",
          placeholderText:
            "Share your volunteer work, community involvement, or other ways you've helped others...",
          maximumWordCount: 250,
        },
        {
          questionId: "other-commitments",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "List your other commitments this semester with approximate weekly hours.",
          secondaryText: "Include: classes, work, clubs, internships, etc.",
          placeholderText:
            "Example: CMSC132 (6hrs), Part-time job (15hrs), Tennis club (3hrs)...",
          maximumWordCount: 200,
        },
        {
          questionId: "time-management",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "How do you plan to manage your time and stay consistently involved with Hack4Impact-UMD?",
          secondaryText: "Time commitment: ~5 hours per week",
          placeholderText:
            "Describe your strategy for balancing H4I with your other commitments...",
          maximumWordCount: 250,
        },
        {
          questionId: "how-did-you-hear",
          questionType: QuestionType.MultipleSelect,
          optional: false,
          questionText: "How did you hear about us?",
          questionOptions: [
            "Friend/Word of mouth",
            "Social media",
            "Terplink",
            "Career fair",
            "Class announcement",
            "Professor recommendation",
            "Other",
          ],
        },
        {
          questionId: "other-skills",
          questionType: QuestionType.LongAnswer,
          optional: true,
          questionText: "What other cool skills do you have?",
          secondaryText:
            "*Examples:* photography, video editing, social media, marketing, nonprofit sourcing, teaching, etc.",
          placeholderText:
            "Tell us about any other talents or skills you'd bring to the team...",
          maximumWordCount: 200,
        },
      ],
    },
    {
      sectionId: "bootcamp-questions",
      sectionName: "Bootcamp Questions",
      description: `
Please answer the following questions if you are interested in bootcamp. We will be especially looking at the quality of your responses since you will not be interviewed for this role.

The bootcamp description is included below for reference.

Bootcamp essentially teaches members the foundation to join a project team. In bootcamp, students learn web development skills starting from basic HTML, JavaScript, and CSS and then building up to the FERN (Firebase, Express, React, Node.js) stack. The goal is for members to complete bootcamp and then join a project team the following semester. Similar to project teams, we are looking for motivated and committed students to join bootcamp and continue working with our nonprofit partners. The bootcamp workflow involves weekly bootcamp meetings, doing the bootcamp assignments during the week, and chapter wide meetings monthly. The time commitment is around 3-5 hours a week.
`,
      forRoles: [ApplicantRole.Bootcamp],
      questions: [
        {
          questionId: "bootcamp-interest",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "Tell us why you are interested in joining the bootcamp.",
          placeholderText:
            "What motivates you to learn web development with us?",
          maximumWordCount: 250,
        },
        {
          questionId: "learning-new-skill",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "Tell us about a time you had to learn a new skill to accomplish a task.",
          placeholderText:
            "Describe the situation, what you learned, and how you approached it...",
          maximumWordCount: 300,
        },
        {
          questionId: "persistence-challenge",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "Describe a time when you had to persist through a significant challenge. How did you approach it and what did you learn from that experience?",
          placeholderText:
            "Share a specific example of overcoming difficulty...",
          maximumWordCount: 300,
        },
        {
          questionId: "project-teams-interest",
          questionType: QuestionType.MultipleChoice,
          optional: false,
          questionText:
            "Are you interested in applying for project teams this semester?",
          questionOptions: ["Yes", "No", "Maybe - depends on my progress"],
        },
      ],
    },
    {
      sectionId: "pm-questions",
      sectionName: "Product Manager Questions",
      description: `
The PM expectations are included below for reference.

PM Specific Responsibilities:
* responsible for drawing out the roadmap for their project
* ensures that all deadlines are met
* meets with team on a weekly basis
* meets with nonprofits on a weekly basis
* meets with tech leads and designers on a weekly basis
* meets with Director of Product weekly to discuss project progression
* be organized in terms of project management
* be accountable for any decisions made for the project
* provide accurate details of project progression
* communicate with nonprofit professionally
* be an effective communicator within the team and maintain structure
* promote participation among team members
* stimulate interaction between team members
* have effective conflict resolution skills
`,
      forRoles: [ApplicantRole.Product],
      questions: [
        {
          questionId: "why-pm",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText: "Why do you want to become a PM at Hack4Impact-UMD?",
          placeholderText: "What attracts you to product management?",
          maximumWordCount: 300,
        },
        {
          questionId: "pm-experiences",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "What experiences, in or out of the classroom, do you have that make you a strong fit for this role?",
          placeholderText:
            "Highlight relevant leadership, project management, or organizational experience...",
          maximumWordCount: 400,
        },
        {
          questionId: "leadership-style",
          questionType: QuestionType.ShortAnswer,
          optional: false,
          questionText:
            "How would you describe your leadership style? (In 50 words or less)",
          placeholderText: "Be concise and specific...",
          maximumWordCount: 50,
        },
        {
          questionId: "communication-style",
          questionType: QuestionType.ShortAnswer,
          optional: false,
          questionText:
            "How would you describe your communication style? (In 50 words or less)",
          placeholderText: "How do you interact with teammates?",
          maximumWordCount: 50,
        },
        {
          questionId: "missed-deadline",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "Tell us about a time you couldn't meet a goal or deadline and how you dealt with/learned from it.",
          placeholderText:
            "Focus on what you learned and how you've improved...",
          maximumWordCount: 300,
        },
        {
          questionId: "self-taught",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "Tell us about a time you taught yourself something. What was it, and how did you do it?",
          placeholderText:
            "Describe your learning process and what you accomplished...",
          maximumWordCount: 250,
        },
        {
          questionId: "ideal-project",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "What's your ideal project look like, and how would you lead this ideal team of your to make the project successful?",
          secondaryText:
            "You can talk about the type of problem you'd want to help solve, how you'd collaborate with engineers, and what kind of process you'd want to lead to make the project successful.",
          placeholderText:
            "Describe the type of project that excites you most...",
          maximumWordCount: 200,
        },
        {
          questionId: "notion-proficiency",
          questionType: QuestionType.MultipleChoice,
          optional: false,
          questionText: "Rate your proficiency with Notion",
          questionOptions: [
            "1 - Unfamiliar",
            "2 - Basic knowledge",
            "3 - Comfortable",
            "4 - Proficient",
            "5 - Use frequently",
          ],
        },
        {
          questionId: "agile-proficiency",
          questionType: QuestionType.MultipleChoice,
          optional: false,
          questionText: "Rate your proficiency with Agile",
          questionOptions: [
            "1 - Unfamiliar",
            "2 - Basic knowledge",
            "3 - Comfortable",
            "4 - Proficient",
            "5 - Use frequently",
          ],
        },
        {
          questionId: "kanban-proficiency",
          questionType: QuestionType.MultipleChoice,
          optional: false,
          questionText: "Rate your proficiency with kanban boards",
          questionOptions: [
            "1 - Unfamiliar",
            "2 - Basic knowledge",
            "3 - Comfortable",
            "4 - Proficient",
            "5 - Use frequently",
          ],
        },
      ],
    },
    {
      sectionId: "design-questions",
      sectionName: "Designer Questions",
      description: `
The Designer expectations are included below for reference.

Designer Responsibilities:
- responsible for creating the frontend designs for the product based on nonprofit needs
- attends team meetings
- attends meetings with nonprofit and PM
- meets with Director of Design to discuss project progression
- walkthrough designs and get nonprofit's feedback
- communicate with engineers on designs and whether or not they are feasible
- complete tasks by the given deadline so that the engineers have enough time to do their tasks as well
- provide feedback to engineers on their implementation of the designs
`,
      forRoles: [ApplicantRole.Designer],
      questions: [
        {
          questionId: "why-designer",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "Why are you interested in becoming a designer at Hack4Impact-UMD, and why do you think you're a good fit?",
          placeholderText: "What draws you to design and our mission?",
          maximumWordCount: 300,
        },
        {
          questionId: "figma-experience",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "What's your experience with Figma (or other design tools)?",
          placeholderText:
            "Describe your familiarity with design software and tools...",
          maximumWordCount: 200,
        },
        {
          questionId: "collaboration-feedback",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "Describe how you collaborate with teammates in different roles, such as designers and engineers. How do you typically respond to feedback, and how do you approach resolving disagreements within a team?",
          placeholderText:
            "Share your approach to teamwork and handling feedback...",
          maximumWordCount: 350,
        },
        {
          questionId: "portfolio",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText: "Portfolio Submission (mandatory)",
          secondaryText:
            "Please include links to your work:\n- Portfolio website\n- Behance/Dribbble\n- Portfolio and/or project file links\n- GitHub repositories\nMake sure we can view your links!",
          placeholderText: "Provide links to your design work...",
          maximumWordCount: 300,
        },
        {
          questionId: "additional-info-design",
          questionType: QuestionType.LongAnswer,
          optional: true,
          questionText:
            "Is there anything else you'd like to share with us that you think is important for your application?",
          placeholderText:
            "Any additional context about your design background or interests...",
          maximumWordCount: 250,
        },
      ],
    },
    {
      sectionId: "general-engineering",
      sectionName: "General Engineering Questions",
      description: `
The Tech Lead expectations are included below for reference.

Tech Lead Responsibilities:
* point of contact for engineers to help with technologies related to their projects
* research technologies and shape the technical direction of the project
* attends team meetings
* attends meetings with nonprofit and PM
* meets with Director of Engineering weekly to discuss project progression
* review pull requests
* add notes for each task on the team Kanban board before the sprint meeting
* update PMs about engineers' status, issues, and progress
* give feedback to designers on the feasibility of design

The Engineer expectations are included below for reference.

Engineer Responsibilities:
* responsible for implementation of all technological aspects of product
* attend team meetings
* complete assigned tasks by the given deadline
* update Tech Lead and PM with any relevant issues

**Note**: Those applying for the engineer and/or tech lead role must also complete a technical assessment (estimated 2 hours) included in this application form.`,
      forRoles: [ApplicantRole.Engineer, ApplicantRole.TechLead],
      questions: [
        {
          questionId: "why-engineering",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "Why engineering at Hack4Impact-UMD? What interests you about an engineering role at Hack4Impact-UMD?",
          placeholderText:
            "What excites you about building technology for social good?",
          maximumWordCount: 300,
        },
        {
          questionId: "engineering-journey",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "Describe your engineering journey thus far. What got you into engineering? What excites you about building technology?",
          placeholderText:
            "Tell us your story with technology and what drives your passion...",
          maximumWordCount: 350,
        },
        {
          questionId: "git-experience",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "What is your experience with Git and Github? If you used it in a collaborative setting, tell us about how you managed pull requests or worked in a shared codebase.",
          secondaryText:
            "Describe your version control experience and any team projects...",
          maximumWordCount: 250,
          placeholderText: "",
        },
        {
          questionId: "tech-stack",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "List the languages, frameworks, or tools you're most familiar with (e.g., React, Node, Django, etc.) and provide a short description of how you've used each.",
          secondaryText:
            "For each technology, briefly explain a project or context where you used it...",
          maximumWordCount: 400,
          placeholderText: "",
        },
        {
          questionId: "team-experience",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "Tell us about a time you worked on a team. What role did you play, and what did you learn from that experience?",
          secondaryText:
            "Describe a collaborative project and your contribution...",
          maximumWordCount: 300,
          placeholderText: "",
        },
        {
          questionId: "admired-technology",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "What's a piece of technology (a product, tool, or system) you admire and why?",
          secondaryText:
            "This could be an app, framework, system architecture, etc...",
          placeholderText: "",
          maximumWordCount: 200,
        },
        {
          questionId: "technical-assessment-link",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "Provide a link to your completed technical assessment repo here",
          placeholderText: "",
          secondaryText: `
All applicants applying for the engineer and/or tech lead role must complete this technical assessment which should take an estimated 2 hours. Note: This assessment is not timed, and you are welcome to take as long as you need until you submit your application.

**Instructions can be found in the following document:**

<https://docs.google.com/document/d/1YnB-So54uxA1HWc7AAPNUiTJKy87G6j0KEiadN5iwAg>

If you encounter technical difficulties or have any other questions regarding the assessment, please send an email to <umd-tech@hack4impact.org>

Provide the link to your completed assessment repo here (e.g. https://github.com/username/FirstnameLastname-h4i-assessment-Fall25)

**Please ensure that your repository is private and that Hack4ImpactUMD is added as a collaborator**

**Only submit the application once you have completed the assessment and DO NOT continue working after the deadline. Thank you!**
`,
          maximumWordCount: 200,
        },
        {
          questionId: "technical-assessment-comments",
          questionType: QuestionType.LongAnswer,
          optional: true,
          questionText: "Comments/Notes",
          placeholderText: "",
          maximumWordCount: 300,
        },
      ],
    },
    {
      sectionId: "engineer-specific",
      sectionName: "Engineer Specific Questions",
      description: `
The Engineer expectations are included below for reference.

Engineer Responsibilities:
- responsible for implementation of all technological aspects of product
- attend team meetings
- complete assigned tasks by the given deadline
- update Tech Lead and PM with any relevant issues

Note: Those applying for the engineer and/or tech lead role must also complete a technical assessment (estimated 2 hours) included in this application form.`,
      forRoles: [ApplicantRole.Engineer],
      questions: [
        {
          questionId: "master-technology",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "If you could instantly master one technology or tool, what would it be and what would you build with it?",
          placeholderText:
            "What technology excites you most and what would you create?",
          maximumWordCount: 250,
        },
        {
          questionId: "project-management-experience",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "Have you worked in teams that use sprints, standups, or project management tools like Trello, Notion, or Jira? Briefly describe your experience (if any). Note that this is not a prerequisite for this role.",
          placeholderText:
            "Any experience with agile methodologies or project management tools...",
          maximumWordCount: 200,
        },
        {
          questionId: "technical-mistake",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "Describe a mistake you made on a technical project (in class, work, research, or for fun). How did you identify and resolve it?",
          placeholderText:
            "Focus on your problem-solving process and what you learned...",
          maximumWordCount: 300,
          secondaryText: "",
        },
        {
          questionId: "ml-engineer-interest",
          questionType: QuestionType.MultipleChoice,
          optional: false,
          questionText:
            "Are you interested in being considered as a Machine Learning Engineer?",
          secondaryText:
            "Please only select Yes if you have **prior experience working with ML!**",
          questionOptions: ["Yes", "No"],
        },
      ],
    },
    {
      sectionId: "tech-lead-specific",
      description: `
Please answer the following questions if you are interested in the Tech Lead role. The Tech Lead expectations are included below for reference.

Tech Lead Responsibilities:
- point of contact for engineers to help with technologies related to their projects
- research technologies and shape the technical direction of the project
- attends team meetings,
- attends meetings with nonprofit and PM
- meets with Director of Engineering weekly to discuss project progression
- review pull requests
- add notes for each task on the team Kanban board before the sprint meeting
- update PMs about engineers' status, issues, and progress
- give feedback to designers on the feasibility of design
`,
      sectionName: "Tech Lead Specific Questions",
      forRoles: [ApplicantRole.TechLead],
      questions: [
        {
          questionId: "tl-motivation",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "What motivates you to step up into the leadership role of a Tech Lead at Hack4Impact-UMD?",
          placeholderText: "What drives you to take on technical leadership?",
          maximumWordCount: 300,
        },
        {
          questionId: "tl-fit",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "What makes you a great fit for the TL role? Discuss any leadership experience, mentoring, or systems design examples.",
          placeholderText:
            "Highlight relevant leadership and technical experience...",
          maximumWordCount: 400,
        },
        {
          questionId: "leadership-understanding",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "What's something you wish more engineering leaders understood?",
          placeholderText: "Share insights about technical leadership...",
          maximumWordCount: 250,
        },
      ],
    },
    {
      sectionId: "pr-outreach",
      sectionName: "PR & Outreach Questions",
      description: `
Please answer the following questions if you are interested in joining our project sourcing team. The sourcing team description is included below for reference.

**Public Relations & Outreach (PR&O)** is Hack4Impact-UMD’s external-facing team, responsible for identifying and securing nonprofit partners, managing organizational communications, and maintaining the org’s public presence. The team includes **Outreach Coordinators**, who lead nonprofit outreach and project sourcing, with optional specialization tracks in finance or long-term growth. It also includes **Social Media Managers**, who create content across platforms like Instagram, TikTok, and YouTube. PR&O is a great fit for students interested in communication, business, social impact, or public policy, and there is no technical background required. The time commitment is around 3-5 hours per week.

**Outreach Coordinator**

Responsible for identifying and engaging potential nonprofit partners for upcoming Hack4Impact-UMD projects. Core responsibilities include sending outreach emails, holding exploratory meetings with nonprofits, drafting comprehensive project descriptions, and presenting them to the Directors of Engineering and Product for feedback.

Optional specialization tracks allow Outreach Coordinators to further support key organizational efforts:

* Finance Specialization: Assists the Directors of Finance with outreach to corporate partners and supports the development of long-term sponsorship relationships.
* Long-Term Growth Specialization: Reconnects with past nonprofit partners to collect feedback and impact stories, and contributes to semesterly and annual impact reporting.

**Social Media Manager**

Focuses on developing and maintaining Hack4Impact-UMD’s social media presence across platforms such as Instagram, TikTok, and YouTube. Responsibilities include creating and scheduling content, maintaining consistent branding, and collaborating with other teams to highlight ongoing projects, organizational milestones, and community impact.`,
      forRoles: [ApplicantRole.SocialMedia, ApplicantRole.OutreachCoord],
      questions: [
        {
          questionId: "role-preference",
          questionType: QuestionType.MultipleChoice,
          optional: true,
          questionText:
            "If you are applying to both roles, please rank your preference here",
          secondaryText: "Select your top preference",
          questionOptions: [
            "Social Media Manager",
            "Outreach Coordinator",
            "Either role works for me",
          ],
        },
        {
          questionId: "preference-reasoning",
          questionType: QuestionType.LongAnswer,
          optional: true,
          questionText:
            "If you are applying to both roles, please explain your ranking here",
          placeholderText: "Explain your interest in these roles...",
          maximumWordCount: 250,
        },
        {
          questionId: "why-pr-outreach",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "What makes you want to join PR & O and why are you a strong candidate?",
          placeholderText:
            "What draws you to communications and outreach work?",
          maximumWordCount: 300,
        },
        {
          questionId: "npo-experience",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "Do you have any prior experience working with Nonprofit Organizations? If not, please put N/A.",
          placeholderText:
            "Describe any volunteer work or nonprofit involvement...",
          maximumWordCount: 200,
        },
        {
          questionId: "nonprofit-research",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText: "Nonprofit Research Assignment",
          secondaryText: `
Find 2 nonprofits in the D.C./Maryland/Virginia area that would be good fits for projects with Hack4Impact-UMD.

For each nonprofit, provide:

- Organization name
- Two-sentence explanation of why they'd be a good fit
`,
          placeholderText:
            "Research local nonprofits that could benefit from technology solutions...",
          maximumWordCount: 400,
        },
      ],
    },
    {
      sectionId: "social-media-manager-questions",
      sectionName: "PR & Outreach Questions: Social Media Manager",
      description: `
**Social Media Manager**

Focuses on developing and maintaining Hack4Impact-UMD’s social media presence across platforms such as Instagram, TikTok, and YouTube. Responsibilities include creating and scheduling content, maintaining consistent branding, and collaborating with other teams to highlight ongoing projects, organizational milestones, and community impact.`,
      forRoles: [ApplicantRole.SocialMedia],
      questions: [
        {
          questionId: "social-media-experience",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "Do you have any experience professionally running social media or video editing on behalf of a club/organization, and if so, can you briefly describe what you did?",
          placeholderText:
            "Describe any content creation or social media management experience...",
          maximumWordCount: 250,
        },
      ],
    },
    {
      sectionId: "outreach-coordinator-questions",
      sectionName: "PR & Outreach Questions: Outreach Coordinator",
      description: `
**Outreach Coordinator**

Responsible for identifying and engaging potential nonprofit partners for upcoming Hack4Impact-UMD projects. Core responsibilities include sending outreach emails, holding exploratory meetings with nonprofits, drafting comprehensive project descriptions, and presenting them to the Directors of Engineering and Product for feedback.

Optional specialization tracks allow Outreach Coordinators to further support key organizational efforts:

* Finance Specialization: Assists the Directors of Finance with outreach to corporate partners and supports the development of long-term sponsorship relationships.
* Long-Term Growth Specialization: Reconnects with past nonprofit partners to collect feedback and impact stories, and contributes to semesterly and annual impact reporting.
`,
      forRoles: [ApplicantRole.OutreachCoord],
      questions: [
        {
          questionId: "professional-communication",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText:
            "Do you have any experience communicating professionally on behalf of a club/organization, and if so, can you briefly describe what you did?",
          secondaryText:
            "Include any relevant communications, marketing, or outreach experience...",
          maximumWordCount: 250,
          placeholderText: "",
        },
        {
          questionId: "video-call-comfort",
          questionType: QuestionType.MultipleChoice,
          optional: false,
          questionText:
            "How comfortable are you going on video calls with a potential nonprofit organization?",
          questionOptions: [
            "Very comfortable",
            "Somewhat comfortable",
            "Neutral",
            "Somewhat uncomfortable",
            "Very uncomfortable",
          ],
        },
        {
          questionId: "specialization-preference",
          questionType: QuestionType.LongAnswer,
          optional: false,
          questionText: `
Please rank your preferences for specializations and provide reasoning for your ranking:
`,
          secondaryText: `
- Finance specializations
- Long-term outreach specialization
- No specialization
`,
          placeholderText: "",
          maximumWordCount: 300,
        },
      ],
    },
  ],
};
