import { useEffect, useState } from "react";
import {
  BookOpen,
  Brain,
  FolderOpen,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Lightbulb,
  Plus,
  Upload,
  ChevronRight,
  Clock3,
  Target,
  X,
  ArrowLeft,
  Folder,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");

  const [spaces, setSpaces] = useState([]);
  const [loadingSpaces, setLoadingSpaces] = useState(true);

  const [showCreateSpace, setShowCreateSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");

  const [selectedSpace, setSelectedSpace] = useState(null);

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");

  const [selectedProject, setSelectedProject] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const logActivity = async (projectId, eventType, description) => {
    try {
      await fetch("/api/activity/log", {
        method: "POST",
        headers: {
          ...apiHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          eventType,
          description,
        }),
      });
    } catch (error) {
      console.warn("Activity tracking failed:", error);
    }
  };

  const apiHeaders = {
    Authorization: `Bearer ${token}`,
  };

  // =========================
  // LOAD SPACES
  // =========================

  const loadSpaces = async () => {
    try {
      setLoadingSpaces(true);

      const response = await fetch("/api/spaces", {
        method: "GET",
        headers: apiHeaders,
      });

      if (!response.ok) {
        throw new Error("Failed to load spaces");
      }

      const data = await response.json();

      setSpaces(data);
    } catch (error) {
      console.error("Error loading spaces:", error);
    } finally {
      setLoadingSpaces(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoadingSpaces(false);
      return;
    }

    loadSpaces();
  }, [isAuthenticated]);

  // =========================
  // CREATE SPACE
  // =========================

  const createSpace = async () => {
    if (!newSpaceName.trim()) {
      return;
    }

    try {
      const response = await fetch("/api/spaces", {
        method: "POST",
        headers: {
          ...apiHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newSpaceName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create space");
      }

      const createdSpace = await response.json();

      setSpaces((previousSpaces) => [
        ...previousSpaces,
        createdSpace,
      ]);

      await logActivity(
        null,
        "SPACE_CREATED",
        `Created learning space: ${createdSpace.name || newSpaceName.trim()}`
      );

      setNewSpaceName("");
      setShowCreateSpace(false);
    } catch (error) {
      console.error("Error creating space:", error);
      alert("Could not create space.");
    }
  };

  // =========================
  // OPEN SPACE
  // =========================

  const openSpace = async (space) => {
    setSelectedSpace(space);
    setSelectedProject(null);
    setProjects([]);
    setLoadingProjects(true);

    try {
      const response = await fetch(
        `/api/projects/space/${space.id}`,
        {
          method: "GET",
          headers: apiHeaders,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load projects");
      }

      const data = await response.json();

      setProjects(data);
    } catch (error) {
      console.error("Error loading projects:", error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  // =========================
  // CREATE PROJECT
  // =========================

  const createProject = async () => {
    if (!newProjectName.trim() || !selectedSpace) {
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/space/${selectedSpace.id}`,
        {
          method: "POST",
          headers: {
            ...apiHeaders,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newProjectName.trim(),
            description: newProjectDescription.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create project");
      }

      const createdProject = await response.json();

      setProjects((previousProjects) => [
        ...previousProjects,
        createdProject,
      ]);

      await logActivity(
        createdProject.id,
        "PROJECT_CREATED",
        `Created project: ${createdProject.name || newProjectName.trim()}`
      );

      setNewProjectName("");
      setNewProjectDescription("");
      setShowCreateProject(false);

      setSpaces((previousSpaces) =>
        previousSpaces.map((space) =>
          space.id === selectedSpace.id
            ? {
                ...space,
                projects: (space.projects || 0) + 1,
              }
            : space
        )
      );

      setSelectedSpace((previousSpace) => ({
        ...previousSpace,
        projects: (previousSpace.projects || 0) + 1,
      }));
    } catch (error) {
      console.error("Error creating project:", error);
      alert(error.message || "Could not create project.");
    }
  };

  // =========================
  // BACK TO SPACES
  // =========================

  const backToSpaces = () => {
    setSelectedProject(null);
  };

  // =========================
  // BACK TO SPACE LIST
  // =========================

  const backToSpaceList = () => {
    setSelectedProject(null);
    setSelectedSpace(null);
    setProjects([]);
  };

  // =========================
  // LOGOUT
  // =========================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setActivePage("dashboard");
    setSelectedProject(null);
    setSelectedSpace(null);
    setSpaces([]);
  };

  // =========================
  // AUTHENTICATION
  // =========================

  if (!isAuthenticated) {
    return <SignInPage onSignedIn={() => setIsAuthenticated(true)} />;
  }

  // =========================
  // PROJECT PAGE
  // =========================

  if (selectedProject) {
    return (
      <AppLayout
        activePage={activePage}
        setActivePage={setActivePage}
        logout={logout}
      >
        <ProjectPage
          project={selectedProject}
          onBack={backToSpaces}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      activePage={activePage}
      setActivePage={setActivePage}
      logout={logout}
    >
      {/* DASHBOARD */}

      {activePage === "dashboard" && (
        <Dashboard
          userName={user.name}
          spaces={spaces}
          loadingSpaces={loadingSpaces}
          token={token}
          onNewSpace={() => setShowCreateSpace(true)}
          onViewSpaces={() => setActivePage("spaces")}
        />
      )}

      {/* SPACES */}

      {activePage === "spaces" && (
        <SpacesPage
          spaces={spaces}
          loadingSpaces={loadingSpaces}
          onNewSpace={() => setShowCreateSpace(true)}
          onOpenSpace={openSpace}
          selectedSpace={selectedSpace}
          setSelectedSpace={setSelectedSpace}
          projects={projects}
          loadingProjects={loadingProjects}
          onNewProject={() => setShowCreateProject(true)}
          onOpenProject={(project) =>
            setSelectedProject(project)
          }
          onBackToSpaces={backToSpaceList}
        />
      )}

      {/* AI TUTOR HUB */}

      {activePage === "tutor" && (
        <TutorHubPage
          spaces={spaces}
          token={token}
          onOpenProject={(project) => setSelectedProject(project)}
        />
      )}

      {/* QUIZZES */}

      {activePage === "quizzes" && (
        <QuizPage
          spaces={spaces}
          token={token}
        />
      )}

      {/* GROWTH */}

      {activePage === "growth" && (
        <GrowthPage
          spaces={spaces}
          token={token}
        />
      )}

      {/* ANALYTICS */}

      {activePage === "analytics" && (
        <AnalyticsPage
          spaces={spaces}
          token={token}
        />
      )}

      {/* ADMIN DASHBOARD */}

      {activePage === "admin" && (
        <AdminDashboardPage token={token} />
      )}

      {/* RECOMMENDATIONS */}

      {activePage === "recommendations" && (
        <RecommendationsPage
          spaces={spaces}
          token={token}
        />
      )}

      {/* OTHER PAGES */}

      {activePage !== "dashboard" &&
        activePage !== "spaces" &&
        activePage !== "tutor" &&
        activePage !== "quizzes" &&
        activePage !== "growth" &&
        activePage !== "analytics" &&
        activePage !== "admin" &&
        activePage !== "recommendations" && (
          <ComingSoonPage page={activePage} />
        )}

      {/* CREATE SPACE MODAL */}

      {showCreateSpace && (
        <CreateSpaceModal
          newSpaceName={newSpaceName}
          setNewSpaceName={setNewSpaceName}
          onCreate={createSpace}
          onClose={() => setShowCreateSpace(false)}
        />
      )}

      {/* CREATE PROJECT MODAL */}

      {showCreateProject && (
        <CreateProjectModal
          projectName={newProjectName}
          setProjectName={setNewProjectName}
          description={newProjectDescription}
          setDescription={setNewProjectDescription}
          onCreate={createProject}
          onClose={() => setShowCreateProject(false)}
        />
      )}
    </AppLayout>
  );
}


/* =========================
   APP LAYOUT
========================= */

function SignInPage({ onSignedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          username: email.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Invalid email or password."
        );
      }

      const token = data.token || data.jwt || data.accessToken;

      if (!token) {
        throw new Error("Login succeeded but no authentication token was returned.");
      }

      const user =
        data.user ||
        data.profile || {
          name:
            data.name ||
            data.fullName ||
            email.trim().split("@")[0],
          email: data.email || email.trim(),
        };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      onSignedIn();
    } catch (loginError) {
      console.error("Sign in failed:", loginError);
      setError(loginError.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Brain className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-bold text-xl text-slate-900">StudyAI</h1>
              <p className="text-sm text-slate-500">Study Companion</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-1">
              Sign in to continue your learning.
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 transition"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function AppLayout({
  children,
  activePage,
  setActivePage,
  logout,
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* SIDEBAR */}

      <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 p-5">

        <div className="flex items-center gap-3 mb-8">

          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Brain
              className="text-white"
              size={23}
            />
          </div>

          <div>

            <h1 className="font-bold text-lg">
              StudyAI
            </h1>

            <p className="text-xs text-slate-500">
              Study Companion
            </p>

          </div>

        </div>


        <nav className="space-y-2">

          <SidebarItem
            icon={<LayoutDashboard size={19} />}
            text="Dashboard"
            active={activePage === "dashboard"}
            onClick={() => setActivePage("dashboard")}
          />

          <SidebarItem
            icon={<FolderOpen size={19} />}
            text="My Spaces"
            active={activePage === "spaces"}
            onClick={() => setActivePage("spaces")}
          />

          <SidebarItem
            icon={<MessageSquare size={19} />}
            text="AI Tutor"
            active={activePage === "tutor"}
            onClick={() => setActivePage("tutor")}
          />

          <SidebarItem
            icon={<BookOpen size={19} />}
            text="Quizzes"
            active={activePage === "quizzes"}
            onClick={() => setActivePage("quizzes")}
          />

          <SidebarItem
            icon={<BarChart3 size={19} />}
            text="Growth"
            active={activePage === "growth"}
            onClick={() => setActivePage("growth")}
          />

          <SidebarItem
            icon={<Clock3 size={19} />}
            text="Analytics"
            active={activePage === "analytics"}
            onClick={() => setActivePage("analytics")}
          />

          <SidebarItem
            icon={<ShieldCheck size={19} />}
            text="Admin Dashboard"
            active={activePage === "admin"}
            onClick={() => setActivePage("admin")}
          />

          <SidebarItem
            icon={<Lightbulb size={19} />}
            text="Recommendations"
            active={activePage === "recommendations"}
            onClick={() =>
              setActivePage("recommendations")
            }
          />

        </nav>


        <div className="absolute bottom-5 left-5 right-5">

          <div className="bg-indigo-50 rounded-xl p-4">

            <p className="text-sm font-semibold text-indigo-900">
              Keep learning 🚀
            </p>

            <p className="text-xs text-indigo-700 mt-1">
              Your consistency matters more than perfection.
            </p>

          </div>

          <button
            onClick={logout}
            className="w-full mt-3 text-sm text-slate-500 hover:text-red-600 py-2"
          >
            Sign out
          </button>

        </div>

      </aside>


      {/* MAIN */}

      <main className="ml-64 p-8">
        {children}
      </main>

    </div>
  );
}


/* =========================
   DASHBOARD
========================= */

function Dashboard({
  userName,
  spaces,
  loadingSpaces,
  token,
  onNewSpace,
  onViewSpaces,
}) {
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      if (!spaces || spaces.length === 0) {
        setDashboardLoading(false);
        return;
      }

      try {
        setDashboardLoading(true);
        setDashboardError("");

        const projectResults = await Promise.all(
          spaces.map(async (space) => {
            const response = await fetch(
              `/api/projects/space/${space.id}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!response.ok) {
              return [];
            }

            return await response.json();
          })
        );

        const allProjects = projectResults.flat();

        if (allProjects.length === 0) {
          setDashboardData(null);
          setDashboardLoading(false);
          return;
        }

        const project = allProjects[0];

        const response = await fetch(
          `/api/dashboard/project/${project.id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load dashboard analytics");
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Error loading dashboard:", error);
        setDashboardError("Could not load learning analytics.");
      } finally {
        setDashboardLoading(false);
      }
    };

    loadDashboard();
  }, [spaces, token]);

  const totalProjects = dashboardData ? 1 : 0;
  const averageScore = dashboardData?.averageQuizScore ?? 0;
  const overallMastery = dashboardData?.overallMastery ?? 0;
  const conceptsTracked = dashboardData?.conceptsTracked ?? 0;
  const conceptsNeedingAttention =
    dashboardData?.conceptsNeedingAttention ?? 0;
  const recommendation = dashboardData?.latestRecommendation;
  const weakestConcept = dashboardData?.weakestConcept;

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-slate-500">
            Good evening 👋
          </p>

          <h2 className="text-3xl font-bold mt-1">
            Welcome back, {userName || "Learner"}
          </h2>

          <p className="text-slate-500 mt-2">
            Continue where you left off.
          </p>
        </div>

        <button
          onClick={onNewSpace}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-indigo-700"
        >
          <Plus size={19} />
          New Space
        </button>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatCard
          icon={<FolderOpen size={21} />}
          label="Learning Spaces"
          value={loadingSpaces ? "..." : spaces.length}
        />

        <StatCard
          icon={<Target size={21} />}
          label="Active Projects"
          value={dashboardLoading ? "..." : totalProjects}
        />

        <StatCard
          icon={<BookOpen size={21} />}
          label="Quiz Score"
          value={dashboardLoading ? "..." : `${averageScore}%`}
        />

        <StatCard
          icon={<Target size={21} />}
          label="Overall Mastery"
          value={dashboardLoading ? "..." : `${overallMastery}%`}
        />
      </div>

      {dashboardLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-6">
          <div className="flex items-center gap-3">
            <Loader2
              size={22}
              className="animate-spin text-indigo-600"
            />
            <p className="text-sm text-slate-500">
              Loading your learning analytics...
            </p>
          </div>
        </div>
      ) : dashboardError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle
              size={20}
              className="text-red-600"
            />
            <p className="text-sm text-red-700">
              {dashboardError}
            </p>
          </div>
        </div>
      ) : dashboardData ? (
        <div className="grid grid-cols-3 gap-5 mb-8">
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Brain
                  size={20}
                  className="text-indigo-600"
                />
              </div>

              <div>
                <h3 className="font-bold">
                  Concept Progress
                </h3>
                <p className="text-xs text-slate-500">
                  Current learning state
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-3xl font-bold">
                {conceptsTracked}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                concepts tracked
              </p>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-500">
                  Overall mastery
                </span>
                <span className="font-semibold">
                  {overallMastery}%
                </span>
              </div>

              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full"
                  style={{
                    width: `${Math.min(overallMastery, 100)}%`,
                  }}
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertCircle
                  size={20}
                  className="text-amber-600"
                />
              </div>

              <div>
                <h3 className="font-bold">
                  Areas to Improve
                </h3>
                <p className="text-xs text-slate-500">
                  Concepts needing attention
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-3xl font-bold">
                {conceptsNeedingAttention}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                concepts below 60%
              </p>
            </div>

            {weakestConcept && (
              <div className="mt-4 bg-amber-50 rounded-xl p-3">
                <p className="text-xs text-amber-700">
                  Focus on
                </p>
                <p className="font-semibold text-sm mt-1">
                  {weakestConcept.concept}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Mastery: {weakestConcept.masteryLevel}%
                </p>
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <BookOpen
                  size={20}
                  className="text-green-600"
                />
              </div>

              <div>
                <h3 className="font-bold">
                  Quiz Performance
                </h3>
                <p className="text-xs text-slate-500">
                  Assessment progress
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-3xl font-bold">
                {dashboardData.quizAttempts}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                quizzes completed
              </p>
            </div>

            <div className="mt-4 text-sm">
              <span className="font-semibold">
                {dashboardData.totalCorrectAnswers}
              </span>
              <span className="text-slate-500">
                {" "}correct answers out of{" "}
              </span>
              <span className="font-semibold">
                {dashboardData.totalQuestionsAnswered}
              </span>
            </div>
          </section>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-6">
        <section className="col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold">
                Your Learning Spaces
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Your projects are organized inside spaces.
              </p>
            </div>

            <button
              onClick={onViewSpaces}
              className="text-sm text-indigo-600 font-medium flex items-center gap-1"
            >
              View all
              <ChevronRight size={16} />
            </button>
          </div>

          {loadingSpaces ? (
            <p className="text-sm text-slate-500">
              Loading your spaces...
            </p>
          ) : spaces.length === 0 ? (
            <div className="text-center py-10">
              <FolderOpen
                size={40}
                className="mx-auto text-slate-300"
              />
              <p className="font-semibold mt-4">
                No learning spaces yet
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Create your first space to get started.
              </p>
              <button
                onClick={onNewSpace}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm"
              >
                Create Space
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {spaces.slice(0, 3).map((space) => (
                <div
                  key={space.id}
                  className="flex items-center justify-between border border-slate-200 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <FolderOpen
                        size={19}
                        className="text-indigo-600"
                      />
                    </div>

                    <div>
                      <h4 className="font-semibold">
                        {space.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {space.projects || 0} projects
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Lightbulb
                  className="text-amber-600"
                  size={21}
                />
              </div>

              <div>
                <h3 className="font-bold">
                  Recommended Next
                </h3>
                <p className="text-xs text-slate-500">
                  Based on your progress
                </p>
              </div>
            </div>

            {recommendation ? (
              <>
                <h4 className="font-semibold">
                  {recommendation.title}
                </h4>

                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  {recommendation.message}
                </p>

                {recommendation.concept && (
                  <div className="mt-3 inline-flex bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium">
                    {recommendation.concept}
                  </div>
                )}
              </>
            ) : (
              <>
                <h4 className="font-semibold">
                  Keep building your learning path
                </h4>

                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Complete a quiz and the system will use your learning progress to recommend your next action.
                </p>
              </>
            )}
          </section>

        </div>
      </div>
    </>
  );
}


/* =========================
   SPACES
========================= */

function SpacesPage({
  spaces,
  loadingSpaces,
  onNewSpace,
  onOpenSpace,
  selectedSpace,
  setSelectedSpace,
  projects,
  loadingProjects,
  onNewProject,
  onOpenProject,
  onBackToSpaces,
}) {

  if (selectedSpace) {

    return (
      <div>

        <button
          onClick={onBackToSpaces}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6"
        >
          <ArrowLeft size={17} />
          Back to Spaces
        </button>


        <div className="flex items-center justify-between mb-8">

          <div className="flex items-center gap-4">

            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">

              <FolderOpen
                className="text-indigo-600"
                size={25}
              />

            </div>

            <div>

              <h2 className="text-3xl font-bold">
                {selectedSpace.name}
              </h2>

              <p className="text-slate-500 mt-1">
                {projects.length} projects
              </p>

            </div>

          </div>

          <button
            onClick={onNewProject}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-indigo-700"
          >
            <Plus size={19} />
            New Project
          </button>

        </div>


        {loadingProjects ? (

          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">

            <Loader2
              size={25}
              className="animate-spin mx-auto text-indigo-600"
            />

            <p className="text-slate-500 mt-3">
              Loading projects...
            </p>

          </div>

        ) : projects.length === 0 ? (

          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">

            <Folder
              size={45}
              className="mx-auto text-slate-300"
            />

            <h3 className="text-lg font-bold mt-4">
              Your projects will appear here
            </h3>

            <p className="text-sm text-slate-500 mt-2">
              Create a project to start adding learning materials.
            </p>

            <button
              onClick={onNewProject}
              className="mt-5 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium"
            >
              Create Project
            </button>

          </div>

        ) : (

          <div className="grid grid-cols-2 gap-5">

            {projects.map((project) => (

              <button
                key={project.id}
                onClick={() => onOpenProject(project)}
                className="text-left w-full bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-300 hover:shadow-sm transition"
              >

                <div className="flex items-start justify-between">

                  <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">

                    <Folder
                      className="text-indigo-600"
                      size={22}
                    />

                  </div>

                  <ChevronRight
                    size={19}
                    className="text-slate-400"
                  />

                </div>

                <h3 className="font-bold text-lg mt-5">
                  {project.name}
                </h3>

                <p className="text-sm text-slate-500 mt-2">
                  {project.description ||
                    "No description provided."}
                </p>

                <p className="text-xs text-slate-400 mt-4">
                  Created{" "}
                  {project.createdAt
                    ? new Date(
                        project.createdAt
                      ).toLocaleDateString()
                    : ""}
                </p>

              </button>

            ))}

          </div>

        )}

      </div>
    );
  }


  return (
    <div>

      <div className="flex items-center justify-between mb-8">

        <div>

          <p className="text-sm text-slate-500">
            Your learning organization
          </p>

          <h2 className="text-3xl font-bold mt-1">
            My Spaces
          </h2>

          <p className="text-slate-500 mt-2">
            Keep different subjects and goals organized.
          </p>

        </div>

        <button
          onClick={onNewSpace}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-indigo-700"
        >
          <Plus size={19} />
          New Space
        </button>

      </div>


      {loadingSpaces ? (

        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">

          <Loader2
            size={25}
            className="animate-spin mx-auto text-indigo-600"
          />

          <p className="text-sm text-slate-500 mt-3">
            Loading your spaces...
          </p>

        </div>

      ) : (

        <div className="grid grid-cols-3 gap-5">

          {spaces.map((space) => (

            <button
              key={space.id}
              onClick={() => onOpenSpace(space)}
              className="text-left bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-300 hover:shadow-sm transition"
            >

              <div className="flex items-center justify-between">

                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">

                  <FolderOpen
                    className="text-indigo-600"
                    size={22}
                  />

                </div>

                <ChevronRight
                  size={19}
                  className="text-slate-400"
                />

              </div>

              <h3 className="font-bold text-lg mt-5">
                {space.name}
              </h3>

              <p className="text-sm text-slate-500 mt-2">
                {space.projects || 0} projects
              </p>

            </button>

          ))}


          <button
            onClick={onNewSpace}
            className="border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[180px] hover:border-indigo-400 hover:bg-indigo-50/30 transition"
          >

            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
              <Plus size={22} />
            </div>

            <p className="font-semibold mt-4">
              Create a Space
            </p>

            <p className="text-sm text-slate-500 mt-1">
              Start a new learning journey
            </p>

          </button>

        </div>

      )}

    </div>
  );
}


/* =========================
   PROJECT PAGE
========================= */

function ProjectPage({
  project,
  onBack,
}) {

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Tutor state
  const [question, setQuestion] = useState("");
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorAnswer, setTutorAnswer] = useState(null);

  // Open-ended assessment state
  const [assessmentQuestion, setAssessmentQuestion] = useState("");
  const [studentAnswer, setStudentAnswer] = useState("");
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);

  const token = localStorage.getItem("token");

  const logActivity = async (eventType, description) => {
    try {
      await fetch("/api/activity/log", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.id,
          eventType,
          description,
        }),
      });
    } catch (error) {
      console.warn("Activity tracking failed:", error);
    }
  };


  const loadMaterials = async () => {

    try {

      setLoading(true);

      const response = await fetch(
        `/api/materials/project/${project.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load materials");
      }

      const data = await response.json();

      setMaterials(data);

    } catch (error) {

      console.error(
        "Error loading materials:",
        error
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {
    loadMaterials();
  }, [project.id]);


  // =========================
  // UPLOAD PDF
  // =========================

  const uploadMaterial = async () => {

    if (!selectedFile) {
      return;
    }

    if (selectedFile.type !== "application/pdf") {

      alert("Only PDF files are allowed.");

      return;
    }

    try {

      setUploading(true);

      const formData = new FormData();

      formData.append(
        "file",
        selectedFile
      );

      const response = await fetch(
        `/api/materials/project/${project.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {

        const errorText =
          await response.text();

        throw new Error(
          errorText || "Upload failed"
        );

      }

      const uploadedMaterial =
        await response.json();

      await logActivity(
        "MATERIAL_UPLOADED",
        `Uploaded study material: ${uploadedMaterial.originalFileName || uploadedMaterial.fileName || "PDF material"}`
      );

      setMaterials(
        (previousMaterials) => [
          ...previousMaterials,
          uploadedMaterial,
        ]
      );

      setSelectedFile(null);

      const input =
        document.getElementById(
          "pdfInput"
        );

      if (input) {
        input.value = "";
      }

      // Refresh after a few seconds
      // so PROCESSING -> READY is visible.

      setTimeout(() => {
        loadMaterials();
      }, 3000);

    } catch (error) {

      console.error(
        "Upload error:",
        error
      );

      alert(error.message);

    } finally {

      setUploading(false);

    }
  };


  // =========================
  // ASK AI TUTOR
  // =========================

  const askTutor = async () => {
    if (!question.trim()) {
      return;
    }

    const readyMaterial = materials.find(
      (material) => material.status === "READY"
    );

    if (!readyMaterial) {
      setTutorAnswer({
        error: "Please upload and wait for a PDF to become READY first.",
      });
      return;
    }

    try {
      setTutorLoading(true);
      setTutorAnswer(null);

      const response = await fetch("/api/tutor/ask", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          materialId: readyMaterial.id,
          question: question.trim(),
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          responseText || `Tutor request failed (${response.status})`
        );
      }

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        data = { answer: responseText };
      }

      setTutorAnswer(data);

      await logActivity(
        "TUTOR_QUESTION",
        `Asked the AI Tutor: ${question.trim().slice(0, 180)}`
      );
    } catch (error) {
      console.error("Tutor error:", error);
      setTutorAnswer({
        error: error.message || "Could not get a tutor response.",
      });
    } finally {
      setTutorLoading(false);
    }
  };


  // =========================
  // OPEN-ENDED ASSESSMENT
  // =========================

  const evaluateOpenEndedAnswer = async () => {
    if (!assessmentQuestion.trim()) {
      alert("Please enter an assessment question.");
      return;
    }

    if (!studentAnswer.trim()) {
      alert("Please write your answer first.");
      return;
    }

    try {
      setAssessmentLoading(true);
      setAssessmentResult(null);

      const response = await fetch(
        "/api/assessments/open-ended",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: project.id,
            question: assessmentQuestion.trim(),
            studentAnswer: studentAnswer.trim(),
          }),
        }
      );

      const responseText = await response.text();

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            responseText ||
            "Assessment failed."
        );
      }

      setAssessmentResult(data);

      await logActivity(
        "OPEN_ENDED_ASSESSMENT",
        `Completed an open-ended assessment${data?.score != null ? ` with a ${data.score}% score` : ""}.`
      );
    } catch (error) {
      console.error(
        "Open-ended assessment error:",
        error
      );

      setAssessmentResult({
        error:
          error.message ||
          "Could not evaluate your answer.",
      });
    } finally {
      setAssessmentLoading(false);
    }
  };


  const getStatusIcon = (status) => {

    if (status === "READY") {

      return (
        <CheckCircle2
          size={18}
          className="text-green-600"
        />
      );

    }

    if (
      status === "PROCESSING" ||
      status === "QUEUED"
    ) {

      return (
        <Loader2
          size={18}
          className="text-indigo-600 animate-spin"
        />
      );

    }

    if (status === "FAILED") {

      return (
        <AlertCircle
          size={18}
          className="text-red-600"
        />
      );

    }

    return <FileText size={18} />;
  };


  const getStatusStyle = (status) => {

    if (status === "READY") {
      return "bg-green-50 text-green-700";
    }

    if (
      status === "PROCESSING" ||
      status === "QUEUED"
    ) {
      return "bg-indigo-50 text-indigo-700";
    }

    if (status === "FAILED") {
      return "bg-red-50 text-red-700";
    }

    return "bg-slate-100 text-slate-600";
  };


  return (
    <div>

      {/* BACK */}

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6"
      >
        <ArrowLeft size={17} />
        Back to Space
      </button>


      {/* PROJECT HEADER */}

      <div className="bg-white border border-slate-200 rounded-2xl p-7 mb-6">

        <div className="flex items-start justify-between">

          <div>

            <p className="text-sm text-indigo-600 font-medium">
              Learning Project
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {project.name}
            </h2>

            <p className="text-slate-500 mt-2 max-w-2xl">
              {project.description ||
                "Build your knowledge by adding learning materials."}
            </p>

          </div>

          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">

            <FileText
              size={25}
              className="text-indigo-600"
            />

          </div>

        </div>

      </div>


      {/* UPLOAD */}

      <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">

        <div className="mb-5">

          <h3 className="text-lg font-bold">
            Learning Materials
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Upload PDF notes, textbooks, lecture slides,
            or study material.
          </p>

        </div>


        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8">

          <div className="text-center">

            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto">

              <Upload
                size={25}
                className="text-indigo-600"
              />

            </div>

            <h4 className="font-semibold mt-4">
              Upload a PDF
            </h4>

            <p className="text-sm text-slate-500 mt-1">
              Your material will be processed automatically.
            </p>


            <input
              id="pdfInput"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(event) => {

                const file =
                  event.target.files?.[0];

                if (file) {
                  setSelectedFile(file);
                }

              }}
            />


            <label
              htmlFor="pdfInput"
              className="inline-block mt-5 cursor-pointer bg-slate-100 hover:bg-slate-200 px-5 py-2.5 rounded-xl text-sm font-medium"
            >
              Choose PDF
            </label>


            {selectedFile && (

              <div className="mt-5">

                <p className="text-sm font-medium">
                  {selectedFile.name}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  {(
                    selectedFile.size /
                    1024 /
                    1024
                  ).toFixed(2)}{" "}
                  MB
                </p>

                <button
                  onClick={uploadMaterial}
                  disabled={uploading}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-5 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2"
                >

                  {uploading && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {uploading
                    ? "Uploading..."
                    : "Upload Material"}

                </button>

              </div>

            )}

          </div>

        </div>

      </section>


      {/* MATERIALS */}

      <section className="bg-white border border-slate-200 rounded-2xl p-6">

        <div className="flex items-center justify-between mb-5">

          <div>

            <h3 className="text-lg font-bold">
              Uploaded Materials
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Materials available to your AI learning companion.
            </p>

          </div>

          <span className="text-sm text-slate-500">
            {materials.length} material
            {materials.length !== 1
              ? "s"
              : ""}
          </span>

        </div>


        {loading ? (

          <div className="py-10 text-center">

            <Loader2
              size={25}
              className="animate-spin mx-auto text-indigo-600"
            />

            <p className="text-sm text-slate-500 mt-3">
              Loading materials...
            </p>

          </div>

        ) : materials.length === 0 ? (

          <div className="py-10 text-center">

            <FileText
              size={40}
              className="mx-auto text-slate-300"
            />

            <p className="font-semibold mt-4">
              No materials yet
            </p>

            <p className="text-sm text-slate-500 mt-1">
              Upload your first PDF to start learning.
            </p>

          </div>

        ) : (

          <div className="space-y-3">

            {materials.map(
              (material) => (

                <div
                  key={material.id}
                  className="flex items-center justify-between border border-slate-200 rounded-xl p-4"
                >

                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">

                      <FileText
                        size={19}
                        className="text-slate-600"
                      />

                    </div>

                    <div>

                      <h4 className="font-semibold text-sm">
                        {material.fileName}
                      </h4>

                      <p className="text-xs text-slate-500 mt-1">
                        Uploaded{" "}
                        {material.uploadedAt
                          ? new Date(
                              material.uploadedAt
                            ).toLocaleString()
                          : ""}
                      </p>

                    </div>

                  </div>


                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusStyle(
                      material.status
                    )}`}
                  >

                    {getStatusIcon(
                      material.status
                    )}

                    {material.status}

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </section>


      {/* =========================
          AI TUTOR
      ========================= */}

      <section className="bg-white border border-slate-200 rounded-2xl p-6 mt-6">

        <div className="flex items-start gap-4 mb-6">

          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
            <MessageSquare
              size={21}
              className="text-indigo-600"
            />
          </div>

          <div>
            <h3 className="text-lg font-bold">
              AI Tutor
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Ask questions about your uploaded learning material.
            </p>
          </div>

        </div>


        {materials.filter(
          (material) => material.status === "READY"
        ).length === 0 ? (

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-800">
              Upload a PDF and wait until it becomes READY before asking the tutor a question.
            </p>
          </div>

        ) : (

          <>
            <textarea
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  askTutor();
                }
              }}
              placeholder="Ask something about your learning material..."
              rows="4"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />

            <div className="flex items-center justify-between mt-3">

              <p className="text-xs text-slate-400">
                Press Enter to ask · Shift + Enter for a new line
              </p>

              <button
                onClick={askTutor}
                disabled={
                  tutorLoading ||
                  !question.trim()
                }
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-5 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2"
              >

                {tutorLoading && (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                )}

                {tutorLoading
                  ? "Thinking..."
                  : "Ask Tutor"}

              </button>

            </div>


            {tutorAnswer && (

              <div className="mt-6 border-t border-slate-200 pt-6">

                {tutorAnswer.error ? (

                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-700">
                      {tutorAnswer.error}
                    </p>
                  </div>

                ) : (

                  <>

                    <h4 className="font-semibold mb-3">
                      Tutor Response
                    </h4>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">

                      <p className="text-sm text-slate-700 leading-7 whitespace-pre-wrap">
                        {tutorAnswer.answer ||
                          tutorAnswer.response ||
                          tutorAnswer.message ||
                          "The tutor returned an empty response."}
                      </p>

                    </div>


                    {tutorAnswer.sources &&
                      tutorAnswer.sources.length > 0 && (

                      <div className="mt-5">

                        <p className="text-sm font-semibold mb-3">
                          Sources
                        </p>

                        <div className="space-y-2">

                          {tutorAnswer.sources.map(
                            (source, index) => (

                              <div
                                key={index}
                                className="flex items-center gap-3 bg-indigo-50 rounded-xl p-3"
                              >

                                <FileText
                                  size={17}
                                  className="text-indigo-600"
                                />

                                <p className="text-sm text-indigo-800">
                                  {source.fileName ||
                                    source.materialName ||
                                    "Learning material"}
                                  {source.page
                                    ? ` — Page ${source.page}`
                                    : ""}
                                </p>

                              </div>

                            )
                          )}

                        </div>

                      </div>

                    )}

                  </>

                )}

              </div>

            )}

          </>

        )}

      </section>


      {/* =========================
          OPEN-ENDED ASSESSMENT
      ========================= */}

      <section className="bg-white border border-slate-200 rounded-2xl p-6 mt-6">

        <div className="flex items-start gap-4 mb-6">

          <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
            <Brain
              size={21}
              className="text-purple-600"
            />
          </div>

          <div>
            <h3 className="text-lg font-bold">
              Open-Ended Assessment
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Explain a concept in your own words and let AI evaluate your understanding.
            </p>
          </div>

        </div>

        <div className="mb-5">
          <label className="block text-sm font-semibold mb-2">
            Question
          </label>

          <textarea
            value={assessmentQuestion}
            onChange={(event) =>
              setAssessmentQuestion(event.target.value)
            }
            placeholder="Example: Explain the difference between a primary key and a foreign key."
            rows="3"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-semibold mb-2">
            Your Answer
          </label>

          <textarea
            value={studentAnswer}
            onChange={(event) =>
              setStudentAnswer(event.target.value)
            }
            placeholder="Explain the concept in your own words..."
            rows="7"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={evaluateOpenEndedAnswer}
            disabled={
              assessmentLoading ||
              !assessmentQuestion.trim() ||
              !studentAnswer.trim()
            }
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-5 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2"
          >
            {assessmentLoading && (
              <Loader2
                size={17}
                className="animate-spin"
              />
            )}

            {assessmentLoading
              ? "Evaluating..."
              : "Evaluate My Answer"}
          </button>
        </div>

        {assessmentResult && (
          <div className="mt-7 border-t border-slate-200 pt-6">

            {assessmentResult.error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700">
                  {assessmentResult.error}
                </p>
              </div>
            ) : (
              <div className="space-y-4">

                <div className="flex items-center justify-between bg-purple-50 border border-purple-100 rounded-xl p-5">
                  <div>
                    <p className="text-sm text-purple-700">
                      Assessment Score
                    </p>

                    <p className="text-3xl font-bold text-purple-900 mt-1">
                      {assessmentResult.score ?? 0}%
                    </p>
                  </div>

                  {assessmentResult.concept && (
                    <span className="bg-white text-purple-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                      {assessmentResult.concept}
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <h4 className="font-semibold mb-2">
                    Overall Feedback
                  </h4>
                  <p className="text-sm text-slate-700 leading-6">
                    {assessmentResult.feedback ||
                      "No overall feedback was returned."}
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                  <h4 className="font-semibold text-green-900 mb-2">
                    What You Understood
                  </h4>
                  <p className="text-sm text-green-800 leading-6">
                    {assessmentResult.understanding ||
                      "No understanding summary was returned."}
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <h4 className="font-semibold text-amber-900 mb-2">
                    What You Are Missing
                  </h4>
                  <p className="text-sm text-amber-800 leading-6">
                    {assessmentResult.missingConcepts ||
                      "No missing concepts were identified."}
                  </p>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                  <h4 className="font-semibold text-indigo-900 mb-2">
                    Reasoning Feedback
                  </h4>
                  <p className="text-sm text-indigo-800 leading-6">
                    {assessmentResult.reasoningFeedback ||
                      "No reasoning feedback was returned."}
                  </p>
                </div>

              </div>
            )}
          </div>
        )}

      </section>


    </div>
  );
}


/* =========================
   QUIZZES
========================= */

function QuizPage({ spaces, token }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");

  const logActivity = async (projectId, eventType, description) => {
    try {
      await fetch("/api/activity/log", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          eventType,
          description,
        }),
      });
    } catch (error) {
      console.warn("Activity tracking failed:", error);
    }
  };

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoadingProjects(true);
        setError("");

        const responses = await Promise.all(
          (spaces || []).map(async (space) => {
            const response = await fetch(
              `/api/projects/space/${space.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!response.ok) {
              return [];
            }

            return await response.json();
          })
        );

        const allProjects = responses.flat();
        setProjects(allProjects);

        if (allProjects.length > 0) {
          setSelectedProjectId(String(allProjects[0].id));
        }
      } catch (err) {
        console.error("Quiz project loading error:", err);
        setError("Could not load your projects.");
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [spaces, token]);

  const loadQuiz = async (projectId) => {
    if (!projectId) {
      setQuestions([]);
      return;
    }

    try {
      setLoadingQuestions(true);
      setError("");
      setResult(null);
      setAnswers({});

      const response = await fetch(
        `/api/quizzes/project/${projectId}?count=5`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.error || text || "Could not load quiz"
        );
      }

      setQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Quiz loading error:", err);
      setQuestions([]);
      setError(err.message || "Could not load quiz.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const generateAIQuiz = async () => {
    if (!selectedProjectId) {
      setError("Please choose a project first.");
      return;
    }

    try {
      setGeneratingAI(true);
      setError("");
      setResult(null);
      setAnswers({});

      const response = await fetch(
        `/api/quiz-generation/project/${selectedProjectId}?count=5`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.error || text || "AI quiz generation failed"
        );
      }

      await loadQuiz(selectedProjectId);
      await loadHistory(selectedProjectId);
    } catch (err) {
      console.error("AI quiz generation error:", err);
      setError(err.message || "Could not generate AI quiz.");
    } finally {
      setGeneratingAI(false);
    }
  };

  const loadHistory = async (projectId) => {
    if (!projectId) {
      setHistory([]);
      return;
    }

    try {
      setLoadingHistory(true);

      const response = await fetch(
        `/api/quizzes/project/${projectId}/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        setHistory([]);
        return;
      }

      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Quiz history error:", err);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      loadQuiz(selectedProjectId);
      loadHistory(selectedProjectId);
    }
  }, [selectedProjectId]);

  const selectedProject = projects.find(
    (project) => String(project.id) === String(selectedProjectId)
  );

  const answeredCount = Object.keys(answers).length;

  const submitQuiz = async () => {
    if (!selectedProjectId || questions.length === 0) {
      return;
    }

    if (answeredCount < questions.length) {
      setError(
        `Please answer all ${questions.length} questions before submitting.`
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await fetch(
        `/api/quizzes/project/${selectedProjectId}/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answers,
          }),
        }
      );

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.error || text || "Quiz submission failed"
        );
      }

      setResult(data);

      await logActivity(
        selectedProjectId,
        "QUIZ_COMPLETED",
        `Completed a ${questions.length}-question quiz with ${data?.correctAnswers ?? 0}/${data?.totalQuestions ?? questions.length} correct.`
      );

      await loadHistory(selectedProjectId);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error("Quiz submission error:", err);
      setError(err.message || "Could not submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  const startNewQuiz = () => {
    setResult(null);
    setAnswers({});
    setError("");
    loadQuiz(selectedProjectId);
  };

  return (
    <div>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-indigo-600 font-medium">
            Assessment
          </p>

          <h2 className="text-3xl font-bold mt-1">
            Quizzes
          </h2>

          <p className="text-slate-500 mt-2">
            Test your understanding and track your learning progress.
          </p>
        </div>
      </div>

      {/* PROJECT SELECTOR */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between gap-5">
          <div>
            <h3 className="font-bold">
              Choose a learning project
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Your quiz questions are connected to the selected project.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {loadingProjects ? (
              <Loader2
                size={22}
                className="animate-spin text-indigo-600"
              />
            ) : (
              <select
                value={selectedProjectId}
                onChange={(event) =>
                  setSelectedProjectId(event.target.value)
                }
                className="border border-slate-300 rounded-xl px-4 py-2.5 min-w-[240px] outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {projects.length === 0 ? (
                  <option value="">
                    No projects available
                  </option>
                ) : (
                  projects.map((project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.name}
                    </option>
                  ))
                )}
              </select>
            )}

            <button
              type="button"
              onClick={generateAIQuiz}
              disabled={!selectedProjectId || generatingAI || loadingProjects}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-4 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap"
            >
              {generatingAI && (
                <Loader2 size={17} className="animate-spin" />
              )}
              {generatingAI ? "Generating..." : "Generate AI Quiz"}
            </button>
          </div>
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle
            size={20}
            className="text-red-600 mt-0.5"
          />
          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
      )}

      {/* RESULT */}
      {result && (
        <section className="bg-white border border-slate-200 rounded-2xl p-7 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Target
                size={26}
                className="text-indigo-600"
              />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Quiz completed
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {result.score}%
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500">
                Correct
              </p>
              <p className="text-xl font-bold mt-1">
                {result.correctAnswers}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500">
                Questions
              </p>
              <p className="text-xl font-bold mt-1">
                {result.totalQuestions}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500">
                Performance
              </p>
              <p className="text-xl font-bold mt-1">
                {result.correctAnswers}/{result.totalQuestions}
              </p>
            </div>
          </div>

          <button
            onClick={startNewQuiz}
            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
          >
            Take Another Quiz
          </button>
        </section>
      )}

      {/* QUIZ */}
      {!result && (
        <section className="bg-white border border-slate-200 rounded-2xl p-7 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold">
                {selectedProject?.name || "Quiz"}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {questions.length > 0
                  ? `${answeredCount} of ${questions.length} answered`
                  : "Choose a project to begin."}
              </p>
            </div>

            {questions.length > 0 && (
              <span className="text-sm font-medium text-indigo-600">
                {questions.length} questions
              </span>
            )}
          </div>

          {loadingQuestions ? (
            <div className="py-12 text-center">
              <Loader2
                size={28}
                className="animate-spin mx-auto text-indigo-600"
              />
              <p className="text-sm text-slate-500 mt-3">
                Preparing your quiz...
              </p>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen
                size={42}
                className="mx-auto text-slate-300"
              />
              <h4 className="font-semibold mt-4">
                No learning projects yet
              </h4>
              <p className="text-sm text-slate-500 mt-1">
                Create a project and add quiz questions to start practicing.
              </p>
            </div>
          ) : questions.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen
                size={42}
                className="mx-auto text-slate-300"
              />
              <h4 className="font-semibold mt-4">
                No quiz questions yet
              </h4>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                This project does not have any quiz questions yet. We will connect AI question generation here later.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="border border-slate-200 rounded-2xl p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
                      {index + 1}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-semibold leading-6">
                          {question.questionText}
                        </p>

                        {question.difficulty && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full shrink-0">
                            {question.difficulty}
                          </span>
                        )}
                      </div>

                      {question.concept && (
                        <p className="text-xs text-slate-400 mt-2">
                          Concept: {question.concept}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-3 mt-5">
                        {[
                          ["A", question.optionA],
                          ["B", question.optionB],
                          ["C", question.optionC],
                          ["D", question.optionD],
                        ].map(([letter, option]) => (
                          <button
                            key={letter}
                            type="button"
                            onClick={() =>
                              setAnswers((previous) => ({
                                ...previous,
                                [question.id]: letter,
                              }))
                            }
                            className={`text-left border rounded-xl p-4 transition ${
                              answers[question.id] === letter
                                ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
                                : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                  answers[question.id] === letter
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {letter}
                              </span>
                              <span className="text-sm leading-6">
                                {option}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-slate-500">
                  {answeredCount} / {questions.length} answered
                </p>

                <button
                  onClick={submitQuiz}
                  disabled={
                    submitting ||
                    answeredCount !== questions.length
                  }
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2"
                >
                  {submitting && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}
                  {submitting ? "Submitting..." : "Submit Quiz"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* HISTORY */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold">
              Quiz History
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Your previous attempts for this project.
            </p>
          </div>
        </div>

        {loadingHistory ? (
          <div className="py-6 text-center">
            <Loader2
              size={22}
              className="animate-spin mx-auto text-indigo-600"
            />
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">
            No quiz attempts yet.
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between border border-slate-200 rounded-xl p-4"
              >
                <div>
                  <p className="font-semibold text-sm">
                    Quiz attempt #{attempt.id}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {attempt.completedAt
                      ? new Date(attempt.completedAt).toLocaleString()
                      : ""}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold">
                    {attempt.score}%
                  </p>
                  <p className="text-xs text-slate-500">
                    {attempt.correctAnswers}/{attempt.totalQuestions} correct
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


/* =========================
   CREATE SPACE MODAL
========================= */

function CreateSpaceModal({
  newSpaceName,
  setNewSpaceName,
  onCreate,
  onClose,
}) {

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">

        <div className="flex items-center justify-between mb-6">

          <div>

            <h2 className="text-xl font-bold">
              Create a New Space
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Organize your learning into a dedicated space.
            </p>

          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <X size={20} />
          </button>

        </div>


        <label className="text-sm font-medium">
          Space name
        </label>

        <input
          value={newSpaceName}
          onChange={(e) =>
            setNewSpaceName(e.target.value)
          }
          onKeyDown={(e) => {

            if (e.key === "Enter") {
              onCreate();
            }

          }}
          placeholder="e.g. Placement Preparation"
          className="w-full mt-2 border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
          autoFocus
        />


        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 font-medium"
          >
            Cancel
          </button>

          <button
            onClick={onCreate}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
          >
            Create Space
          </button>

        </div>

      </div>

    </div>
  );
}


/* =========================
   CREATE PROJECT MODAL
========================= */

function CreateProjectModal({
  projectName,
  setProjectName,
  description,
  setDescription,
  onCreate,
  onClose,
}) {

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">

        <div className="flex items-center justify-between mb-6">

          <div>

            <h2 className="text-xl font-bold">
              Create a New Project
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Start a learning project inside this space.
            </p>

          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <X size={20} />
          </button>

        </div>


        <label className="text-sm font-medium">
          Project name
        </label>

        <input
          value={projectName}
          onChange={(e) =>
            setProjectName(e.target.value)
          }
          placeholder="e.g. Java DSA"
          className="w-full mt-2 border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
        />


        <label className="text-sm font-medium block mt-4">
          Description
        </label>

        <textarea
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          placeholder="e.g. Prepare data structures and algorithms for placements"
          rows="3"
          className="w-full mt-2 border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />


        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 font-medium"
          >
            Cancel
          </button>

          <button
            onClick={onCreate}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
          >
            Create Project
          </button>

        </div>

      </div>

    </div>
  );
}


/* =========================
   GROWTH
========================= */

function GrowthPage({ spaces, token }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [data, setData] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingGrowth, setLoadingGrowth] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoadingProjects(true);
        setError("");

        const responses = await Promise.all(
          (spaces || []).map(async (space) => {
            const response = await fetch(
              `/api/projects/space/${space.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!response.ok) {
              return [];
            }

            return await response.json();
          })
        );

        const allProjects = responses.flat();
        setProjects(allProjects);

        if (allProjects.length > 0) {
          setSelectedProjectId(String(allProjects[0].id));
        }
      } catch (err) {
        console.error("Growth project loading error:", err);
        setError("Could not load your projects.");
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [spaces, token]);

  useEffect(() => {
    const loadGrowth = async () => {
      if (!selectedProjectId) {
        setData(null);
        setQuizHistory([]);
        return;
      }

      try {
        setLoadingGrowth(true);
        setError("");

        const response = await fetch(
          `/api/dashboard/project/${selectedProjectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const text = await response.text();
        let result;

        try {
          result = JSON.parse(text);
        } catch {
          result = null;
        }

        if (!response.ok) {
          throw new Error(
            result?.error || text || "Could not load growth data"
          );
        }

        setData(result);

        // Use the existing quiz history endpoint as the source of truth
        // for cumulative answered/correct question counts.
        try {
          const historyResponse = await fetch(
            `/api/quizzes/project/${selectedProjectId}/history`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (historyResponse.ok) {
            const historyText = await historyResponse.text();
            let historyData = [];

            try {
              historyData = JSON.parse(historyText);
            } catch {
              historyData = [];
            }

            setQuizHistory(
              Array.isArray(historyData) ? historyData : []
            );
          } else {
            setQuizHistory([]);
          }
        } catch (historyError) {
          console.error("Quiz history analytics error:", historyError);
          setQuizHistory([]);
        }
      } catch (err) {
        console.error("Growth loading error:", err);
        setData(null);
        setError(err.message || "Could not load growth data.");
      } finally {
        setLoadingGrowth(false);
      }
    };

    loadGrowth();
  }, [selectedProjectId, token]);

  const selectedProject = projects.find(
    (project) => String(project.id) === String(selectedProjectId)
  );

  if (loadingProjects) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <Loader2
            size={28}
            className="animate-spin mx-auto text-indigo-600"
          />
          <p className="text-sm text-slate-500 mt-3">
            Loading your learning projects...
          </p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center bg-white border border-slate-200 rounded-2xl p-8 max-w-md">
          <BarChart3
            size={40}
            className="mx-auto text-slate-300"
          />
          <h2 className="text-xl font-bold mt-4">
            No learning data yet
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Create a project and complete some learning activities to see your growth here.
          </p>
        </div>
      </div>
    );
  }

  const overallMastery = data?.overallMastery ?? 0;
  const conceptsTracked = data?.conceptsTracked ?? 0;
  const strongConcepts = data?.strongConcepts ?? 0;
  const conceptsNeedingAttention = data?.conceptsNeedingAttention ?? 0;
  const weakestConcept = data?.weakestConcept;
  const latestQuiz = data?.latestQuiz;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-slate-500">
            Learning progress
          </p>
          <h2 className="text-3xl font-bold mt-1">
            Growth
          </h2>
          <p className="text-slate-500 mt-2">
            Understand how your learning is progressing.
          </p>
        </div>

        <select
          value={selectedProjectId}
          onChange={(event) =>
            setSelectedProjectId(event.target.value)
          }
          className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {projects.map((project) => (
            <option
              key={project.id}
              value={project.id}
            >
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {loadingGrowth ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <Loader2
            size={28}
            className="animate-spin mx-auto text-indigo-600"
          />
          <p className="text-sm text-slate-500 mt-3">
            Analyzing your learning progress...
          </p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <AlertCircle
              size={20}
              className="text-red-600"
            />
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      ) : (
        <>
          <section className="bg-white border border-slate-200 rounded-2xl p-7 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600 font-medium">
                  {selectedProject?.name || "Current Project"}
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  Overall Learning Mastery
                </h3>
                <p className="text-sm text-slate-500 mt-2">
                  Mastery is an estimate based on your recorded learning evidence.
                </p>
              </div>

              <div className="w-28 h-28 rounded-full border-8 border-indigo-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-indigo-700">
                  {overallMastery}%
                </span>
              </div>
            </div>

            <div className="mt-6 h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{
                  width: `${Math.min(overallMastery, 100)}%`,
                }}
              />
            </div>
          </section>

          <div className="grid grid-cols-3 gap-5 mb-6">
            <StatCard
              icon={<Brain size={21} />}
              label="Concepts Tracked"
              value={conceptsTracked}
            />

            <StatCard
              icon={<CheckCircle2 size={21} />}
              label="Strong Concepts"
              value={strongConcepts}
            />

            <StatCard
              icon={<AlertCircle size={21} />}
              label="Need Attention"
              value={conceptsNeedingAttention}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <section className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Target
                    size={20}
                    className="text-amber-600"
                  />
                </div>
                <div>
                  <h3 className="font-bold">
                    Focus Area
                  </h3>
                  <p className="text-xs text-slate-500">
                    Concept requiring the most attention
                  </p>
                </div>
              </div>

              {weakestConcept ? (
                <div className="bg-amber-50 rounded-xl p-5">
                  <p className="text-xs text-amber-700 font-medium">
                    Weakest tracked concept
                  </p>
                  <h4 className="text-lg font-bold mt-2">
                    {weakestConcept.concept}
                  </h4>

                  <div className="flex items-center justify-between mt-4 text-sm">
                    <span className="text-slate-500">
                      Mastery
                    </span>
                    <span className="font-bold">
                      {weakestConcept.masteryLevel}%
                    </span>
                  </div>

                  <div className="h-2 bg-white rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          weakestConcept.masteryLevel,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="text-xs text-slate-500 mt-4">
                    {weakestConcept.correctAnswers} correct out of {weakestConcept.totalAnswers} recorded answers.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain
                    size={35}
                    className="mx-auto text-slate-300"
                  />
                  <p className="font-semibold mt-3">
                    No weak concept identified yet
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Complete more assessments to build learning evidence.
                  </p>
                </div>
              )}
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <BookOpen
                    size={20}
                    className="text-green-600"
                  />
                </div>
                <div>
                  <h3 className="font-bold">
                    Latest Assessment
                  </h3>
                  <p className="text-xs text-slate-500">
                    Most recent quiz performance
                  </p>
                </div>
              </div>

              {latestQuiz ? (
                <div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold">
                      {latestQuiz.score}%
                    </span>
                    <span className="text-sm text-slate-500 mb-1">
                      score
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-500">
                        Correct
                      </p>
                      <p className="text-xl font-bold mt-1">
                        {latestQuiz.correctAnswers}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-500">
                        Questions
                      </p>
                      <p className="text-xl font-bold mt-1">
                        {latestQuiz.totalQuestions}
                      </p>
                    </div>
                  </div>

                  {latestQuiz.completedAt && (
                    <p className="text-xs text-slate-400 mt-4">
                      Completed {new Date(latestQuiz.completedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen
                    size={35}
                    className="mx-auto text-slate-300"
                  />
                  <p className="font-semibold mt-3">
                    No assessments yet
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Take your first quiz to start building your growth history.
                  </p>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}



/* =========================
   ANALYTICS
========================= */

function AnalyticsPage({ spaces, token }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [data, setData] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoadingProjects(true);
        setError("");

        const responses = await Promise.all(
          (spaces || []).map(async (space) => {
            const response = await fetch(
              `/api/projects/space/${space.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!response.ok) {
              return [];
            }

            return await response.json();
          })
        );

        const allProjects = responses.flat();
        setProjects(allProjects);

        if (allProjects.length > 0) {
          setSelectedProjectId(String(allProjects[0].id));
        }
      } catch (err) {
        console.error("Analytics project loading error:", err);
        setError("Could not load your projects.");
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [spaces, token]);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!selectedProjectId) {
        setData(null);
        setQuizHistory([]);
        return;
      }

      try {
        setLoadingAnalytics(true);
        setError("");

        const response = await fetch(
          `/api/dashboard/project/${selectedProjectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const text = await response.text();
        let result = null;

        try {
          result = JSON.parse(text);
        } catch {
          result = null;
        }

        if (!response.ok) {
          throw new Error(
            result?.error || text || "Could not load analytics"
          );
        }

        setData(result);

        try {
          const historyResponse = await fetch(
            `/api/quizzes/project/${selectedProjectId}/history`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (historyResponse.ok) {
            const historyText = await historyResponse.text();
            let historyData = [];

            try {
              historyData = JSON.parse(historyText);
            } catch {
              historyData = [];
            }

            setQuizHistory(
              Array.isArray(historyData) ? historyData : []
            );
          } else {
            setQuizHistory([]);
          }
        } catch (historyError) {
          console.error("Analytics quiz history error:", historyError);
          setQuizHistory([]);
        }
      } catch (err) {
        console.error("Analytics loading error:", err);
        setData(null);
        setError(err.message || "Could not load analytics.");
      } finally {
        setLoadingAnalytics(false);
      }
    };

    loadAnalytics();
  }, [selectedProjectId, token]);

  const selectedProject = projects.find(
    (project) =>
      String(project.id) === String(selectedProjectId)
  );

  if (loadingProjects) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <Loader2
            size={28}
            className="animate-spin mx-auto text-indigo-600"
          />
          <p className="text-sm text-slate-500 mt-3">
            Loading your learning projects...
          </p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center bg-white border border-slate-200 rounded-2xl p-8 max-w-md">
          <BarChart3
            size={40}
            className="mx-auto text-slate-300"
          />
          <h2 className="text-xl font-bold mt-4">
            No analytics yet
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Create a project and complete some learning
            activities to build your analytics.
          </p>
        </div>
      </div>
    );
  }

  const overallMastery = Number(
    data?.overallMastery ?? 0
  );
  const averageQuizScore = Number(
    data?.averageQuizScore ?? 0
  );
  const conceptsTracked = data?.conceptsTracked ?? 0;
  const strongConcepts = data?.strongConcepts ?? 0;
  const conceptsNeedingAttention =
    data?.conceptsNeedingAttention ?? 0;
  const calculatedQuizAttempts = quizHistory.length;
  const calculatedTotalQuestions = quizHistory.reduce(
    (sum, attempt) =>
      sum + Number(attempt?.totalQuestions ?? 0),
    0
  );
  const calculatedTotalCorrect = quizHistory.reduce(
    (sum, attempt) =>
      sum + Number(attempt?.correctAnswers ?? 0),
    0
  );

  const quizAttempts =
    calculatedQuizAttempts > 0
      ? calculatedQuizAttempts
      : data?.quizAttempts ?? 0;
  const totalQuestions =
    calculatedQuizAttempts > 0
      ? calculatedTotalQuestions
      : data?.totalQuestions ?? 0;
  const totalCorrect =
    calculatedQuizAttempts > 0
      ? calculatedTotalCorrect
      : data?.totalCorrect ?? 0;
  const weakestConcept = data?.weakestConcept;
  const latestQuiz = data?.latestQuiz;
  const recommendation = data?.latestRecommendation;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-indigo-600 font-medium">
            Project analytics
          </p>
          <h2 className="text-3xl font-bold mt-1">
            Learning Analytics
          </h2>
          <p className="text-slate-500 mt-2">
            Understand your learning performance, concept
            health, and next focus area.
          </p>
        </div>

        <select
          value={selectedProjectId}
          onChange={(event) =>
            setSelectedProjectId(event.target.value)
          }
          className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {projects.map((project) => (
            <option
              key={project.id}
              value={project.id}
            >
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {loadingAnalytics ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <Loader2
            size={28}
            className="animate-spin mx-auto text-indigo-600"
          />
          <p className="text-sm text-slate-500 mt-3">
            Calculating your learning analytics...
          </p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <AlertCircle
              size={20}
              className="text-red-600"
            />
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-4 gap-5 mb-6">
            <StatCard
              icon={<Target size={21} />}
              label="Overall Mastery"
              value={`${Math.round(overallMastery)}%`}
            />

            <StatCard
              icon={<BookOpen size={21} />}
              label="Average Quiz Score"
              value={`${Math.round(averageQuizScore)}%`}
            />

            <StatCard
              icon={<Clock3 size={21} />}
              label="Quiz Attempts"
              value={quizAttempts}
            />

            <StatCard
              icon={<Brain size={21} />}
              label="Concepts Tracked"
              value={conceptsTracked}
            />
          </section>

          <section className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Target
                    size={20}
                    className="text-indigo-600"
                  />
                </div>
                <div>
                  <h3 className="font-bold">
                    Mastery Snapshot
                  </h3>
                  <p className="text-xs text-slate-500">
                    Current learning evidence
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    Overall mastery
                  </span>
                  <span className="font-bold">
                    {Math.round(overallMastery)}%
                  </span>
                </div>

                <div className="h-3 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{
                      width: `${Math.min(
                        Math.max(overallMastery, 0),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-xs text-green-700">
                    Strong concepts
                  </p>
                  <p className="text-2xl font-bold text-green-800 mt-1">
                    {strongConcepts}
                  </p>
                </div>

                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="text-xs text-amber-700">
                    Need attention
                  </p>
                  <p className="text-2xl font-bold text-amber-800 mt-1">
                    {conceptsNeedingAttention}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <AlertCircle
                    size={20}
                    className="text-amber-600"
                  />
                </div>
                <div>
                  <h3 className="font-bold">
                    Focus Area
                  </h3>
                  <p className="text-xs text-slate-500">
                    Concept requiring the most attention
                  </p>
                </div>
              </div>

              {weakestConcept ? (
                <div className="bg-amber-50 rounded-xl p-5 mt-6">
                  <p className="text-xs text-amber-700">
                    Weakest tracked concept
                  </p>
                  <h4 className="text-xl font-bold mt-2">
                    {weakestConcept.concept}
                  </h4>

                  <div className="flex items-center justify-between mt-5 text-sm">
                    <span className="text-slate-600">
                      Mastery
                    </span>
                    <span className="font-bold">
                      {weakestConcept.masteryLevel}%
                    </span>
                  </div>

                  <div className="h-2 bg-white rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          Math.max(
                            Number(
                              weakestConcept.masteryLevel ?? 0
                            ),
                            0
                          ),
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="text-xs text-slate-500 mt-4">
                    {weakestConcept.correctAnswers} correct
                    out of {weakestConcept.totalAnswers} recorded
                    answers.
                  </p>
                </div>
              ) : (
                <div className="text-center py-10">
                  <Brain
                    size={34}
                    className="mx-auto text-slate-300"
                  />
                  <p className="font-semibold mt-3">
                    No focus area yet
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Complete more learning activities to build
                    concept evidence.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <BookOpen
                  size={20}
                  className="text-blue-600"
                />
              </div>
              <div>
                <h3 className="font-bold">
                  Assessment Performance
                </h3>
                <p className="text-xs text-slate-500">
                  Recorded quiz activity for this project
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500">
                  Questions answered
                </p>
                <p className="text-2xl font-bold mt-1">
                  {totalQuestions}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500">
                  Correct answers
                </p>
                <p className="text-2xl font-bold mt-1">
                  {totalCorrect}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500">
                  Average score
                </p>
                <p className="text-2xl font-bold mt-1">
                  {Math.round(averageQuizScore)}%
                </p>
              </div>
            </div>

            {latestQuiz && (
              <div className="mt-5 bg-indigo-50 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-indigo-700 font-medium">
                      Latest quiz
                    </p>
                    <p className="text-lg font-bold text-indigo-900 mt-1">
                      {latestQuiz.score}%
                    </p>
                  </div>
                  <p className="text-sm text-indigo-800">
                    {latestQuiz.correctAnswers} /{" "}
                    {latestQuiz.totalQuestions} correct
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Lightbulb
                  size={20}
                  className="text-purple-600"
                />
              </div>
              <div>
                <h3 className="font-bold">
                  Recommended Next Action
                </h3>
                <p className="text-xs text-slate-500">
                  Derived from your current learning state
                </p>
              </div>
            </div>

            {recommendation ? (
              <div className="mt-5 bg-purple-50 rounded-xl p-5">
                <p className="text-xs text-purple-700 font-semibold uppercase tracking-wide">
                  {recommendation.actionType
                    ? recommendation.actionType.replaceAll(
                        "_",
                        " "
                      )
                    : "Continue Learning"}
                </p>
                <h4 className="text-xl font-bold text-purple-900 mt-2">
                  {recommendation.title}
                </h4>
                <p className="text-sm text-purple-800 leading-6 mt-2">
                  {recommendation.message}
                </p>
              </div>
            ) : (
              <div className="mt-5 bg-slate-50 rounded-xl p-5">
                <p className="text-sm text-slate-600">
                  No recommendation has been generated yet.
                  Complete more assessments to build enough
                  evidence for a next-step recommendation.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/* =========================
   ADMIN DASHBOARD
========================= */

function AdminDashboardPage({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAdminDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/activity/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const text = await response.text();
        let result = null;

        try {
          result = JSON.parse(text);
        } catch {
          result = null;
        }

        if (!response.ok) {
          throw new Error(
            result?.error || text || "Could not load admin dashboard"
          );
        }

        setData(result);
      } catch (err) {
        console.error("Admin dashboard error:", err);
        setData(null);
        setError(err.message || "Could not load admin dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadAdminDashboard();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <Loader2
            size={28}
            className="animate-spin mx-auto text-indigo-600"
          />
          <p className="text-sm text-slate-500 mt-3">
            Loading operations data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const recentActivity = data?.recentActivity || [];

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm text-indigo-600 font-medium">
          Operations & activity
        </p>
        <h2 className="text-3xl font-bold mt-1">
          Admin Dashboard
        </h2>
        <p className="text-slate-500 mt-2">
          Operational activity for the signed-in learner account.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-6">
        <StatCard
          icon={<Clock3 size={21} />}
          label="Events Recorded"
          value={data?.totalEvents ?? 0}
        />
        <StatCard
          icon={<BookOpen size={21} />}
          label="Quiz Completions"
          value={data?.quizCompletions ?? 0}
        />
        <StatCard
          icon={<MessageSquare size={21} />}
          label="Tutor Questions"
          value={data?.tutorInteractions ?? 0}
        />
        <StatCard
          icon={<Upload size={21} />}
          label="Material Uploads"
          value={data?.materialUploads ?? 0}
        />
        <StatCard
          icon={<Folder size={21} />}
          label="Project Creations"
          value={data?.projectCreations ?? 0}
        />
        <StatCard
          icon={<Brain size={21} />}
          label="Open-Ended Assessments"
          value={data?.openEndedAssessments ?? 0}
        />
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Clock3 size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold">Recent Activity</h3>
            <p className="text-xs text-slate-500">
              Latest learning and system events
            </p>
          </div>
        </div>

        {recentActivity.length === 0 ? (
          <div className="text-center py-10">
            <p className="font-semibold">No activity recorded yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Complete a project action and it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start justify-between gap-4 bg-slate-50 rounded-xl p-4"
              >
                <div>
                  <p className="text-xs font-semibold text-indigo-600">
                    {(activity.eventType || "ACTIVITY").replaceAll("_", " ")}
                  </p>
                  <p className="text-sm font-medium mt-1">
                    {activity.description}
                  </p>
                </div>
                <p className="text-xs text-slate-400 whitespace-nowrap">
                  {activity.createdAt
                    ? new Date(activity.createdAt).toLocaleString()
                    : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


/* =========================
   RECOMMENDATIONS
========================= */

function RecommendationsPage({ spaces, token }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoadingProjects(true);
        setError("");

        const responses = await Promise.all(
          (spaces || []).map(async (space) => {
            const response = await fetch(
              `/api/projects/space/${space.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!response.ok) return [];

            return await response.json();
          })
        );

        const allProjects = responses.flat();
        setProjects(allProjects);

        if (allProjects.length > 0) {
          setSelectedProjectId(String(allProjects[0].id));
        }
      } catch (err) {
        console.error("Recommendation project loading error:", err);
        setError("Could not load your projects.");
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [spaces, token]);

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!selectedProjectId) {
        setRecommendations([]);
        return;
      }

      try {
        setLoadingRecommendations(true);
        setError("");

        const response = await fetch(
          `/api/dashboard/project/${selectedProjectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const text = await response.text();
        let result;

        try {
          result = JSON.parse(text);
        } catch {
          result = null;
        }

        if (!response.ok) {
          throw new Error(
            result?.error || text || "Could not load recommendations"
          );
        }

        setRecommendations(
          result?.latestRecommendation
            ? [result.latestRecommendation]
            : []
        );
      } catch (err) {
        console.error("Recommendation loading error:", err);
        setRecommendations([]);
        setError(err.message || "Could not load recommendations.");
      } finally {
        setLoadingRecommendations(false);
      }
    };

    loadRecommendations();
  }, [selectedProjectId, token]);

  const selectedProject = projects.find(
    (project) => String(project.id) === String(selectedProjectId)
  );

  if (loadingProjects) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <Loader2
            size={28}
            className="animate-spin mx-auto text-indigo-600"
          />
          <p className="text-sm text-slate-500 mt-3">
            Loading your learning projects...
          </p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center bg-white border border-slate-200 rounded-2xl p-8 max-w-md">
          <Lightbulb
            size={40}
            className="mx-auto text-slate-300"
          />
          <h2 className="text-xl font-bold mt-4">
            No learning projects yet
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Create a project and complete some learning activities to receive personalized recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-slate-500">
            Personalized next steps
          </p>
          <h2 className="text-3xl font-bold mt-1">
            Recommendations
          </h2>
          <p className="text-slate-500 mt-2">
            Use your learning evidence to decide what to focus on next.
          </p>
        </div>

        <select
          value={selectedProjectId}
          onChange={(event) =>
            setSelectedProjectId(event.target.value)
          }
          className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {projects.map((project) => (
            <option
              key={project.id}
              value={project.id}
            >
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {loadingRecommendations ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <Loader2
            size={28}
            className="animate-spin mx-auto text-indigo-600"
          />
          <p className="text-sm text-slate-500 mt-3">
            Finding your next learning step...
          </p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <AlertCircle
              size={20}
              className="text-red-600"
            />
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto">
            <Lightbulb
              size={28}
              className="text-indigo-600"
            />
          </div>

          <h3 className="text-xl font-bold mt-5">
            No recommendation yet
          </h3>

          <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">
            {selectedProject?.name || "This project"} does not have a generated recommendation yet. Complete more quizzes and learning activities so the system has evidence to guide your next step.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {recommendations.map((recommendation) => (
            <section
              key={recommendation.id || recommendation.concept}
              className="bg-white border border-slate-200 rounded-2xl p-7"
            >
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <Lightbulb
                    size={24}
                    className="text-indigo-600"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">
                        Recommended next step
                      </p>
                      <h3 className="text-2xl font-bold mt-1">
                        {recommendation.title || "Keep learning"}
                      </h3>
                    </div>

                    {recommendation.actionType && (
                      <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                        {recommendation.actionType.replaceAll("_", " ")}
                      </span>
                    )}
                  </div>

                  <p className="text-slate-600 mt-4 leading-7">
                    {recommendation.message ||
                      "Continue practicing this area to strengthen your understanding."}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-500">
                        Project
                      </p>
                      <p className="font-semibold mt-1">
                        {selectedProject?.name || "Current project"}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-500">
                        Focus concept
                      </p>
                      <p className="font-semibold mt-1">
                        {recommendation.concept || "Mixed concepts"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}


/* =========================
   TUTOR HUB
========================= */

function TutorHubPage({ spaces, token, onOpenProject }) {
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (spaces?.length && !selectedSpaceId) {
      setSelectedSpaceId(String(spaces[0].id));
    }
  }, [spaces, selectedSpaceId]);

  useEffect(() => {
    const loadProjects = async () => {
      if (!selectedSpaceId) {
        setProjects([]);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/projects/space/${selectedSpaceId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load projects");
        }

        const data = await response.json();
        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setProjects([]);
        setError("Unable to load projects for this space.");
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [selectedSpaceId, token]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">AI Tutor</h2>
        <p className="text-slate-500 mt-1">Choose a project to ask questions about your uploaded learning material.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Learning space
        </label>

        <select
          value={selectedSpaceId}
          onChange={(event) => setSelectedSpaceId(event.target.value)}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select a space</option>
          {(spaces || []).map((space) => (
            <option key={space.id} value={space.id}>
              {space.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold">Projects</h3>

        {loading && (
          <p className="text-slate-500 mt-4">Loading projects...</p>
        )}

        {!loading && error && (
          <p className="text-red-600 mt-4">{error}</p>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="mt-4 p-5 rounded-xl bg-slate-50 text-slate-500">
            No projects found in this space yet. Create a project from My Spaces first.
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="grid gap-4 mt-4">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => onOpenProject(project)}
                className="text-left p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <MessageSquare size={19} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{project.name}</p>
                    <p className="text-sm text-slate-500 mt-1">Open project tutor</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


/* =========================
   COMING SOON
========================= */

function ComingSoonPage({ page }) {

  const titles = {
    quizzes: "Quizzes",
    growth: "Growth",
    recommendations: "Recommendations",
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">

      <div className="text-center">

        <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto">

          <Brain
            size={30}
            className="text-indigo-600"
          />

        </div>

        <h2 className="text-2xl font-bold mt-5">
          {titles[page]}
        </h2>

        <p className="text-slate-500 mt-2">
          This section is coming next.
        </p>

      </div>

    </div>
  );
}


/* =========================
   REUSABLE COMPONENTS
========================= */

function SidebarItem({
  icon,
  text,
  active,
  onClick,
}) {

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
        active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon}
      {text}
    </button>
  );
}


function StatCard({
  icon,
  label,
  value,
}) {

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">

      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
        {icon}
      </div>

      <p className="text-sm text-slate-500 mt-4">
        {label}
      </p>

      <p className="text-2xl font-bold mt-1">
        {value}
      </p>

    </div>
  );
}


function ActionButton({
  icon,
  text,
  onClick,
}) {

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-medium"
    >

      <div className="text-indigo-600">
        {icon}
      </div>

      {text}

      <ChevronRight
        size={16}
        className="ml-auto text-slate-400"
      />

    </button>
  );
}


export default App;