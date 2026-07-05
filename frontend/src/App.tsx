import { PermissionRole } from "@app-portal/shared/constants";
import { QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import RequireAuth from "./components/auth/RequireAuth";
import RequireNoAuth from "./components/auth/RequireNoAuth";
import Loading from "./components/Loading";
import AuthProvider from "./components/providers/AuthProvider";
import FormProvider from "./components/providers/FormProvider";
import SearchProvider from "./components/providers/SearchProvider";
import UpdateNotifier from "./components/UpdateNotifier";
import { queryClient } from "./config/query";
import LandingPage from "./pages/LandingPage";

const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const AutograderRunPage = lazy(() => import("./pages/AutograderRunPage"));
const StatusPage = lazy(() => import("./components/status/StatusPage"));
const DecisionPage = lazy(() => import("./components/status/DecisionPage"));
const SignUp = lazy(() => import("./pages/sign-up/SignUp"));
const LogIn = lazy(() => import("./pages/log-in/LogIn"));
const ForgotPass = lazy(() => import("./pages/forgot-pass/ForgotPass"));
const ResetPassCard = lazy(() => import("./pages/reset-pass/ResetPassCard"));
const Layout = lazy(() => import("./pages/Layout"));
const ApplicationPage = lazy(() => import("./pages/applicant/ApplicationPage"));
const AppOverview = lazy(() => import("./pages/applicant/AppOverview"));
const AppSubmitted = lazy(
  () => import("./pages/applicant/app-submitted/AppSubmitted"),
);
const AppSubmitPage = lazy(() => import("./pages/applicant/AppSubmitPage"));
const AppReviewPage = lazy(() => import("./pages/reviewer/AppReviewPage"));
const InterviewPage = lazy(() => import("./pages/reviewer/InterviewPage"));
const UserRolePage = lazy(
  () => import("./pages/super-reviewer/dashboards/UserRolePage"),
);
const ReviewerApplicationsDashboard = lazy(
  () => import("./pages/reviewer/ReviewerApplicationsDashboard"),
);
const AdminHome = lazy(() => import("./pages/super-reviewer/AdminHome"));
const AutograderDashboard = lazy(
  () => import("./pages/super-reviewer/AutograderDashboard"),
);
const SuperReviewerDashboardShell = lazy(
  () => import("./pages/super-reviewer/dashboards/SuperReviewerDashboardShell"),
);
const UnderReviewDashboard = lazy(
  () => import("./pages/super-reviewer/dashboards/UnderReviewDashboard"),
);
const AssignedReviewsPage = lazy(() =>
  import("./pages/super-reviewer/dashboards/AssignedReviewsPage").then(
    (module) => ({
      default: module.AssignedReviewsPage,
    }),
  ),
);
const AssignedInterviewsPage = lazy(() =>
  import("./pages/super-reviewer/dashboards/AssignedInterviewsPage").then(
    (module) => ({
      default: module.AssignedInterviewsPage,
    }),
  ),
);
const AcceptanceConfirmationDashboard = lazy(
  () =>
    import("./pages/super-reviewer/dashboards/AcceptanceConfirmationDashboard"),
);
const ReviewerAssignmentsPage = lazy(() =>
  import("./pages/super-reviewer/dashboards/ReviewerAssignmentsPage").then(
    (module) => ({
      default: module.ReviewerAssignmentsPage,
    }),
  ),
);
const InterviewerAssignmentsPage = lazy(() =>
  import("./pages/super-reviewer/dashboards/InterviewerAssignmentsPage").then(
    (module) => ({
      default: module.InterviewerAssignmentsPage,
    }),
  ),
);
const AppRevisitPage = lazy(() => import("./pages/applicant/AppRevisitPage"));
const BoardInterviewsDashboard = lazy(
  () => import("./pages/board/BoardInterviewsDashboard"),
);
const BoardAllApplicationsDashboard = lazy(
  () => import("./pages/board/BoardAllApplicationsDashboard"),
);
const QualifiedApplicationsDashboard = lazy(
  () =>
    import("./pages/super-reviewer/dashboards/QualifiedApplicationsDashboard"),
);
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const ViewApplicationPage = lazy(
  () => import("./pages/super-reviewer/ViewApplicationPage"),
);
const ReviewerDashboardShell = lazy(
  () => import("./pages/reviewer/ReviewerDashboardShell"),
);
const BoardDashboardShell = lazy(
  () => import("./pages/board/BoardDashboardShell"),
);
const SuperReviewerReviewersDashboard = lazy(
  () =>
    import("./pages/super-reviewer/dashboards/SuperReviewerReviewersDashboard"),
);
const SuperReviewerBoardDashboard = lazy(
  () => import("./pages/super-reviewer/dashboards/SuperReviewerBoardDashboard"),
);
const ReviewerInterviewsDashboard = lazy(
  () => import("./pages/reviewer/ReviewerInterviewsDashboard"),
);
const FormBuilderPage = lazy(
  () => import("./pages/super-reviewer/FormBuilderPage"),
);
const RubricBuilderPage = lazy(
  () => import("./pages/super-reviewer/RubricBuilderPage"),
);
const SuperReviewerInterviewersDashboard = lazy(
  () =>
    import("./pages/super-reviewer/dashboards/SuperReviewerInterviewersDashboard"),
);
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UpdateNotifier>
        <AuthProvider>
          <ToastContainer
            position="bottom-right"
            toastClassName={() => "bg-transparent shadow-none border-none mb-3"}
          />
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/" element={<Layout />}>
                <Route element={<Navigate to="/login" />} />

                <Route
                  path="/profile"
                  element={
                    <RequireAuth>
                      <ProfilePage />
                    </RequireAuth>
                  }
                />

                <Route
                  path="/autograder/:jobId"
                  element={
                    <RequireAuth>
                      <AutograderRunPage />
                    </RequireAuth>
                  }
                />

                <Route path="/apply">
                  <Route
                    index
                    element={
                      <RequireAuth>
                        <AppOverview />
                      </RequireAuth>
                    }
                  ></Route>
                  <Route
                    element={
                      <div className="w-full h-full bg-muted">
                        <RequireAuth requireRoles={[PermissionRole.Applicant]}>
                          <FormProvider />
                        </RequireAuth>
                      </div>
                    }
                  >
                    <Route
                      path="f/:formId/:sectionId"
                      element={<ApplicationPage />}
                    />
                  </Route>
                  <Route
                    path="status"
                    element={
                      <RequireAuth requireRoles={[PermissionRole.Applicant]}>
                        <StatusPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="revisit/:formId"
                    element={
                      <RequireAuth requireRoles={[PermissionRole.Applicant]}>
                        <AppRevisitPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="submit/:formId"
                    element={
                      <RequireAuth requireRoles={[PermissionRole.Applicant]}>
                        <AppSubmitPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="success"
                    element={
                      <RequireAuth requireRoles={[PermissionRole.Applicant]}>
                        <AppSubmitted />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="decision/:responseId/:role"
                    element={
                      <RequireAuth requireRoles={[PermissionRole.Applicant]}>
                        <DecisionPage />
                      </RequireAuth>
                    }
                  ></Route>
                </Route>

                <Route path="/admin">
                  <Route
                    index
                    element={
                      <RequireAuth>
                        <AdminHome />
                      </RequireAuth>
                    }
                  ></Route>

                  <Route
                    path="autograder"
                    element={
                      <RequireAuth
                        requireRoles={[
                          PermissionRole.SuperReviewer,
                          PermissionRole.Board,
                        ]}
                      >
                        <AutograderDashboard />
                      </RequireAuth>
                    }
                  />

                  <Route
                    path="dor/"
                    element={
                      <RequireAuth
                        requireRoles={[PermissionRole.SuperReviewer]}
                      >
                        <SearchProvider>
                          <SuperReviewerDashboardShell />
                        </SearchProvider>
                      </RequireAuth>
                    }
                  >
                    <Route
                      path="dashboard/:formId/all"
                      element={<UnderReviewDashboard />}
                    />
                    <Route
                      path="dashboard/:formId/qualified"
                      element={<QualifiedApplicationsDashboard />}
                    />
                    <Route
                      path="dashboard/:formId/reviewers"
                      element={<SuperReviewerReviewersDashboard />}
                    />
                    <Route
                      path="dashboard/:formId/board"
                      element={<SuperReviewerBoardDashboard />}
                    />
                    <Route
                      path="dashboard/:formId/interviewers"
                      element={<SuperReviewerInterviewersDashboard />}
                    />
                    <Route
                      path="dashboard/:formId/acceptance-confirmation"
                      element={<AcceptanceConfirmationDashboard />}
                    />
                    <Route
                      path="dashboard/:formId/assigned-reviews"
                      element={<ReviewerApplicationsDashboard />}
                    />
                    <Route
                      path="dashboard/:formId/assigned-interviews"
                      element={<ReviewerInterviewsDashboard />}
                    />
                  </Route>

                  <Route
                    path="board/application/:formId/:responseId"
                    element={
                      <RequireAuth
                        requireRoles={[
                          PermissionRole.Board,
                          PermissionRole.SuperReviewer,
                        ]}
                      >
                        <ViewApplicationPage />
                      </RequireAuth>
                    }
                  />

                  <Route
                    path="board/reviews/:responseId"
                    element={
                      <RequireAuth
                        requireRoles={[
                          PermissionRole.Board,
                          PermissionRole.SuperReviewer,
                        ]}
                      >
                        <AssignedReviewsPage />
                      </RequireAuth>
                    }
                  />

                  <Route
                    path="board/interviews/:responseId"
                    element={
                      <RequireAuth
                        requireRoles={[
                          PermissionRole.Board,
                          PermissionRole.SuperReviewer,
                        ]}
                      >
                        <AssignedInterviewsPage />
                      </RequireAuth>
                    }
                  />

                  <Route
                    path="board/reviewer/:formId/:reviewerId"
                    element={
                      <RequireAuth
                        requireRoles={[
                          PermissionRole.Board,
                          PermissionRole.SuperReviewer,
                        ]}
                      >
                        <ReviewerAssignmentsPage />
                      </RequireAuth>
                    }
                  />

                  <Route
                    path="board/interviewer/:formId/:interviewerId"
                    element={
                      <RequireAuth
                        requireRoles={[
                          PermissionRole.Board,
                          PermissionRole.SuperReviewer,
                        ]}
                      >
                        <InterviewerAssignmentsPage />
                      </RequireAuth>
                    }
                  />

                  <Route
                    path="dor/users"
                    element={
                      <RequireAuth
                        requireRoles={[PermissionRole.SuperReviewer]}
                      >
                        <UserRolePage></UserRolePage>
                      </RequireAuth>
                    }
                  />

                  <Route
                    path="dor/form-builder/:formId"
                    element={
                      <RequireAuth
                        requireRoles={[PermissionRole.SuperReviewer]}
                      >
                        <FormBuilderPage />
                      </RequireAuth>
                    }
                  />

                  <Route
                    path="dor/rubric-builder/:formId"
                    element={
                      <RequireAuth
                        requireRoles={[PermissionRole.SuperReviewer]}
                      >
                        <RubricBuilderPage />
                      </RequireAuth>
                    }
                  />

                  <Route
                    path="reviewer/dashboard/:formId/"
                    element={
                      <RequireAuth requireRoles={[PermissionRole.Reviewer]}>
                        <SearchProvider>
                          <ReviewerDashboardShell />
                        </SearchProvider>
                      </RequireAuth>
                    }
                  >
                    <Route
                      path="apps"
                      element={<ReviewerApplicationsDashboard />}
                    />

                    <Route
                      path="interviews"
                      element={<ReviewerInterviewsDashboard />}
                    />
                  </Route>

                  <Route
                    path="board/dashboard/:formId/"
                    element={
                      <RequireAuth requireRoles={[PermissionRole.Board]}>
                        <SearchProvider>
                          <BoardDashboardShell />
                        </SearchProvider>
                      </RequireAuth>
                    }
                  >
                    <Route
                      path="all"
                      element={<BoardAllApplicationsDashboard />}
                    />
                    <Route
                      path="interviews"
                      element={<BoardInterviewsDashboard />}
                    />
                    <Route
                      path="assigned-reviews"
                      element={<ReviewerApplicationsDashboard />}
                    />
                    <Route
                      path="assigned-interviews"
                      element={<ReviewerInterviewsDashboard />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequireAuth
                        requireRoles={[
                          PermissionRole.Reviewer,
                          PermissionRole.Board,
                          PermissionRole.SuperReviewer,
                        ]}
                      >
                        <Outlet />
                      </RequireAuth>
                    }
                  >
                    <Route
                      path="review/f/:formId/:responseId/:sectionId/:reviewDataId"
                      element={<AppReviewPage />}
                    />
                    <Route
                      path="interview/f/:formId/:responseId/:interviewDataId"
                      element={<InterviewPage />}
                    />
                  </Route>
                </Route>
              </Route>
              <Route
                path="/signup"
                element={
                  <RequireNoAuth
                    redirect={{
                      applicant: "/apply",
                      reviewer: "/admin",
                      board: "/admin",
                      "super-reviewer": "/admin",
                    }}
                  >
                    <SignUp />
                  </RequireNoAuth>
                }
              />
              <Route
                path="/login"
                element={
                  <RequireNoAuth
                    redirect={{
                      applicant: "/apply",
                      reviewer: "/admin",
                      board: "/admin",
                      "super-reviewer": "/admin",
                    }}
                  >
                    <LogIn />
                  </RequireNoAuth>
                }
              />
              <Route path="/forgotpassword" element={<ForgotPass />}></Route>
              <Route path="/resetpassword" element={<ResetPassCard />}></Route>
              <Route path="/verify" element={<VerifyEmailPage />}></Route>

              {/*WARN:MAKE SURE THIS IS THE LAST ROUTE*/}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </UpdateNotifier>
    </QueryClientProvider>
  );
}

export default App;
