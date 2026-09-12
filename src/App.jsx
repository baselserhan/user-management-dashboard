import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  LogOut,
  Lock,
  AlertCircle,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";

import { THEMES } from "./lib/theme";
import {
  ROLES,
  initialMembers,
  initialCredentials,
  MEMBERS_KEY,
  CREDENTIALS_KEY,
  THEME_KEY,
  SESSION_KEY,
  initials,
  emptyDraft,
} from "./lib/constants";
import { storage } from "./lib/storage";
import Dot from "./components/Dot";
import FieldWrap, { fieldBorder } from "./components/FieldWrap";
import ToastCard from "./components/ToastCard";

export default function App() {
  const [session, setSession] = useState(null);
  const [members, setMembers] = useState(initialMembers);
  const [credentials, setCredentials] = useState(initialCredentials);
  const [theme, setTheme] = useState("dark"); // 'dark' | 'light'
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginFieldErrors, setLoginFieldErrors] = useState({});
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "", role: "Viewer" });
  const [signupFieldErrors, setSignupFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null); // { id, type: 'error' | 'success', title, message }
  const [search, setSearch] = useState("");
  const [panel, setPanel] = useState(null); // { mode: 'add' | 'edit', draft }
  const [panelError, setPanelError] = useState("");
  const [panelFieldErrors, setPanelFieldErrors] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [feedback, setFeedback] = useState("");

  const C = THEMES[theme];

  // Load any previously saved roster, credentials, theme preference, and
  // signed-in session once on mount. If nothing is stored yet, seed storage
  // with the starter data so future refreshes — and newly created
  // accounts — find it.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [membersResult, credentialsResult, themeResult, sessionResult] = await Promise.all([
          storage.get(MEMBERS_KEY).catch(() => null),
          storage.get(CREDENTIALS_KEY).catch(() => null),
          storage.get(THEME_KEY).catch(() => null),
          storage.get(SESSION_KEY).catch(() => null),
        ]);
        if (cancelled) return;

        let loadedMembers = initialMembers;
        if (membersResult?.value) {
          loadedMembers = JSON.parse(membersResult.value);
          setMembers(loadedMembers);
        } else {
          await storage.set(MEMBERS_KEY, JSON.stringify(initialMembers));
        }

        if (credentialsResult?.value) {
          setCredentials(JSON.parse(credentialsResult.value));
        } else {
          await storage.set(CREDENTIALS_KEY, JSON.stringify(initialCredentials));
        }

        if (themeResult?.value === "light" || themeResult?.value === "dark") {
          setTheme(themeResult.value);
        }

        // Only restore the session if it still points at a real member —
        // e.g. guards against a stale session surviving that member's
        // deletion.
        if (sessionResult?.value) {
          try {
            const savedSession = JSON.parse(sessionResult.value);
            if (savedSession?.memberId && loadedMembers.some((m) => m.id === savedSession.memberId)) {
              setSession(savedSession);
            }
          } catch {
            // Ignore a corrupted session value — user just lands on sign-in.
          }
        }
      } catch (err) {
        if (!cancelled) setStorageError("Couldn't load saved data — starting with the default roster.");
      } finally {
        if (!cancelled) setStorageReady(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist every change once the initial load has finished, so we never
  // overwrite saved data with the default roster before it's been read.
  useEffect(() => {
    if (!storageReady) return;
    storage.set(MEMBERS_KEY, JSON.stringify(members)).catch(() => {
      setStorageError("Couldn't save your last change. It may not survive a refresh.");
    });
  }, [members, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    storage.set(CREDENTIALS_KEY, JSON.stringify(credentials)).catch(() => {
      setStorageError("Couldn't save your account changes. They may not survive a refresh.");
    });
  }, [credentials, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    storage.set(THEME_KEY, theme).catch(() => {
      // Non-critical — worst case the theme just resets to dark next visit.
    });
  }, [theme, storageReady]);

  // Keep the signed-in session persisted so a refresh doesn't sign anyone
  // out. Cleared from storage on logout instead of just left stale.
  useEffect(() => {
    if (!storageReady) return;
    if (session) {
      storage.set(SESSION_KEY, JSON.stringify(session)).catch(() => {
        // Non-critical — worst case a refresh just requires signing in again.
      });
    } else {
      storage.delete(SESSION_KEY).catch(() => {});
    }
  }, [session, storageReady]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  const currentMember = members.find((m) => m.id === session?.memberId) || null;
  const isAdmin = currentMember?.role === "Admin";
  const loginFormComplete = loginForm.email.trim().length > 0 && loginForm.password.length > 0;
  const signupFormComplete =
    signupForm.name.trim().length > 0 && signupForm.email.trim().length > 0 && signupForm.password.length > 0;

  function flash(msg) {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 3200);
  }

  function showToast(type, title, message) {
    setToast({ id: Date.now(), type, title, message });
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  function attemptLogin(email, password) {
    const account = credentials.find((c) => c.email.toLowerCase() === email.toLowerCase());
    if (!account) {
      showToast("error", "We can't find that account", "Double check the email, or create a new account.");
      return;
    }
    if (account.password !== password) {
      showToast("error", "Incorrect password", "That password doesn't match this account.");
      return;
    }
    const member = members.find((m) => m.id === account.memberId);
    setSession({ memberId: account.memberId });
    showToast("success", `Welcome back, ${member?.name?.split(" ")[0] || "there"}`, "You're signed in.");
  }

  function handleLoginSubmit() {
    if (isSubmitting) return;
    const errors = {};
    if (!loginForm.email.trim()) errors.email = true;
    if (!loginForm.password) errors.password = true;
    if (Object.keys(errors).length > 0) {
      setLoginFieldErrors(errors);
      showToast("error", "Fill in both fields", "Email and password are required.");
      return;
    }
    setLoginFieldErrors({});
    setIsSubmitting(true);
    // Small simulated delay so the button's loading state is visible —
    // swap this for the real request latency once there's a backend.
    setTimeout(() => {
      try {
        attemptLogin(loginForm.email.trim(), loginForm.password);
      } catch (err) {
        showToast("error", "Something went wrong", "Please try signing in again.");
      } finally {
        setIsSubmitting(false);
      }
    }, 650);
  }

  function handleSignupSubmit() {
    if (isSubmitting) return;
    const name = signupForm.name.trim();
    const email = signupForm.email.trim();
    const password = signupForm.password;

    const requiredErrors = {};
    if (!name) requiredErrors.name = true;
    if (!email) requiredErrors.email = true;
    if (!password) requiredErrors.password = true;
    if (Object.keys(requiredErrors).length > 0) {
      setSignupFieldErrors(requiredErrors);
      showToast("error", "Fill in all fields", "Name, email, and password are required.");
      return;
    }
    setSignupFieldErrors({});

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setSignupFieldErrors({ email: true });
      showToast("error", "Invalid email", "Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setSignupFieldErrors({ password: true });
      showToast("error", "Password too short", "Use at least 6 characters.");
      return;
    }
    if (credentials.some((c) => c.email.toLowerCase() === email.toLowerCase())) {
      setSignupFieldErrors({ email: true });
      showToast("error", "That email's already registered", "Sign in instead, or use a different email.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(async () => {
      try {
        const nextId = Math.max(0, ...members.map((m) => m.id)) + 1;
        const newMember = { id: nextId, name, email, department: "Unassigned", role: signupForm.role, status: "Active" };
        const newCredential = { email, password, memberId: nextId };
        const updatedMembers = [...members, newMember];
        const updatedCredentials = [...credentials, newCredential];

        // Persist explicitly and wait for confirmation before treating the
        // account as created — this closes the race where a refresh right
        // after signup could otherwise land before the background save
        // effect finishes writing, making the new account "disappear".
        await storage.set(MEMBERS_KEY, JSON.stringify(updatedMembers));
        await storage.set(CREDENTIALS_KEY, JSON.stringify(updatedCredentials));

        setMembers(updatedMembers);
        setCredentials(updatedCredentials);
        setSession({ memberId: nextId });
        showToast("success", `Welcome, ${name.split(" ")[0]}`, "Your account is ready.");
        setSignupForm({ name: "", email: "", password: "", role: "Viewer" });
        setSignupFieldErrors({});
        setMode("signin");
      } catch (err) {
        showToast("error", "Couldn't save your account", "Check your connection and try again.");
      } finally {
        setIsSubmitting(false);
      }
    }, 650);
  }

  function handleKeyDown(e, submitFn) {
    if (e.key === "Enter") submitFn();
  }

  function logout() {
    setSession(null);
    setLoginForm({ email: "", password: "" });
    setLoginFieldErrors({});
    setSignupForm({ name: "", email: "", password: "", role: "Viewer" });
    setSignupFieldErrors({});
    setMode("signin");
    setSearch("");
    setPanel(null);
  }

  function openAdd() {
    if (!isAdmin) return;
    setPanelError("");
    setPanelFieldErrors({});
    setPanel({ mode: "add", draft: emptyDraft() });
  }

  function openEdit(member) {
    const canEdit = isAdmin || member.id === currentMember.id;
    if (!canEdit) return;
    setPanelError("");
    setPanelFieldErrors({});
    setPanel({ mode: "edit", draft: { ...member } });
  }

  function closePanel() {
    setPanel(null);
    setPanelError("");
    setPanelFieldErrors({});
  }

  function validateDraft(draft, excludeId) {
    const errors = {};
    if (!draft.name.trim()) errors.name = true;
    if (!draft.email.trim()) errors.email = true;
    if (isAdmin && !draft.department.trim()) errors.department = true;

    if (Object.keys(errors).length > 0) {
      return { errors, message: "Fill in all required fields." };
    }
    if (!/^\S+@\S+\.\S+$/.test(draft.email.trim())) {
      return { errors: { email: true }, message: "Enter a valid email address." };
    }
    const emailTaken = members.some(
      (m) => m.email.toLowerCase() === draft.email.trim().toLowerCase() && m.id !== excludeId
    );
    if (emailTaken) {
      return { errors: { email: true }, message: "Someone already uses that email." };
    }
    return { errors: {}, message: "" };
  }

  function savePanel() {
    const { mode: panelMode, draft } = panel;
    const excludeId = panelMode === "edit" ? draft.id : null;
    const { errors, message } = validateDraft(draft, excludeId);
    if (message) {
      setPanelFieldErrors(errors);
      setPanelError(message);
      return;
    }
    setPanelFieldErrors({});
    setPanelError("");

    if (panelMode === "add") {
      const nextId = Math.max(0, ...members.map((m) => m.id)) + 1;
      setMembers([...members, { ...draft, name: draft.name.trim(), email: draft.email.trim(), id: nextId }]);
      flash(`Added ${draft.name.trim()} to the roster.`);
    } else {
      // Non-admins can only change their own name and email — role, department
      // and status stay locked to the original record regardless of draft state.
      const original = members.find((m) => m.id === draft.id);
      const safeDraft = isAdmin
        ? draft
        : { ...original, name: draft.name.trim(), email: draft.email.trim() };
      setMembers(members.map((m) => (m.id === draft.id ? { ...safeDraft, name: safeDraft.name.trim(), email: safeDraft.email.trim() } : m)));
      flash(draft.id === currentMember.id ? "Updated your profile." : `Updated ${safeDraft.name.trim()}.`);
    }
    closePanel();
  }

  function deleteMember(id) {
    if (!isAdmin) return;
    if (id === currentMember.id) {
      flash("You can't remove your own account.");
      setConfirmDeleteId(null);
      return;
    }
    const target = members.find((m) => m.id === id);
    setMembers(members.filter((m) => m.id !== id));
    setConfirmDeleteId(null);
    flash(`Removed ${target.name} from the roster.`);
  }

  const filtered = members
    .filter((m) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.id - a.id); // newest members first

  const totalActive = members.filter((m) => m.status === "Active").length;
  const totalAdmins = members.filter((m) => m.role === "Admin").length;

  // ---------------- Login screen ----------------
  if (!session) {
    if (!storageReady) {
      return (
        <div
          className="min-h-screen w-full flex items-center justify-center"
          style={{ backgroundColor: C.bg, color: C.textMuted, fontFamily: "system-ui, sans-serif" }}
        >
          <p className="text-sm">Loading roster…</p>
        </div>
      );
    }
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center p-6"
        style={{ backgroundColor: C.bg, color: C.text, fontFamily: "system-ui, sans-serif" }}
      >
        <ToastCard toast={toast} onClose={() => setToast(null)} C={C} />
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Team Roster</h1>
            <p className="text-sm mt-1" style={{ color: C.textMuted }}>
              {mode === "signin" ? "Sign in to view or manage the directory." : "Create an account to join the directory."}
            </p>
          </div>

          <div
            className="rounded-lg p-6"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
          >
            {mode === "signin" ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm block mb-1.5" style={{ color: C.textMuted }}>
                    Email
                  </label>
                  <FieldWrap hasError={loginFieldErrors.email} C={C}>
                    <input
                      type="text"
                      value={loginForm.email}
                      onChange={(e) => {
                        setLoginForm({ ...loginForm, email: e.target.value });
                        if (loginFieldErrors.email) setLoginFieldErrors({ ...loginFieldErrors, email: false });
                      }}
                      onKeyDown={(e) => handleKeyDown(e, handleLoginSubmit)}
                      placeholder="you@company.com"
                      className="w-full rounded-md px-3 py-2 pr-9 text-sm outline-none"
                      style={{ backgroundColor: C.bg, border: fieldBorder(loginFieldErrors.email, C), color: C.text }}
                    />
                  </FieldWrap>
                </div>
                <div>
                  <label className="text-sm block mb-1.5" style={{ color: C.textMuted }}>
                    Password
                  </label>
                  <FieldWrap hasError={loginFieldErrors.password} C={C}>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => {
                        setLoginForm({ ...loginForm, password: e.target.value });
                        if (loginFieldErrors.password) setLoginFieldErrors({ ...loginFieldErrors, password: false });
                      }}
                      onKeyDown={(e) => handleKeyDown(e, handleLoginSubmit)}
                      placeholder="Enter your password"
                      className="w-full rounded-md px-3 py-2 pr-9 text-sm outline-none"
                      style={{ backgroundColor: C.bg, border: fieldBorder(loginFieldErrors.password, C), color: C.text }}
                    />
                  </FieldWrap>
                </div>

                <button
                  type="button"
                  onClick={handleLoginSubmit}
                  disabled={isSubmitting || !loginFormComplete}
                  className="w-full rounded-md py-2 text-sm font-medium mt-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: C.accent, color: "#1A1300" }}
                >
                  {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                  {isSubmitting ? "Signing in…" : "Sign in"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm block mb-1.5" style={{ color: C.textMuted }}>
                    Name
                  </label>
                  <FieldWrap hasError={signupFieldErrors.name} C={C}>
                    <input
                      type="text"
                      value={signupForm.name}
                      onChange={(e) => {
                        setSignupForm({ ...signupForm, name: e.target.value });
                        if (signupFieldErrors.name) setSignupFieldErrors({ ...signupFieldErrors, name: false });
                      }}
                      onKeyDown={(e) => handleKeyDown(e, handleSignupSubmit)}
                      placeholder="Your full name"
                      className="w-full rounded-md px-3 py-2 pr-9 text-sm outline-none"
                      style={{ backgroundColor: C.bg, border: fieldBorder(signupFieldErrors.name, C), color: C.text }}
                    />
                  </FieldWrap>
                </div>
                <div>
                  <label className="text-sm block mb-1.5" style={{ color: C.textMuted }}>
                    Email
                  </label>
                  <FieldWrap hasError={signupFieldErrors.email} C={C}>
                    <input
                      type="text"
                      value={signupForm.email}
                      onChange={(e) => {
                        setSignupForm({ ...signupForm, email: e.target.value });
                        if (signupFieldErrors.email) setSignupFieldErrors({ ...signupFieldErrors, email: false });
                      }}
                      onKeyDown={(e) => handleKeyDown(e, handleSignupSubmit)}
                      placeholder="you@company.com"
                      className="w-full rounded-md px-3 py-2 pr-9 text-sm outline-none"
                      style={{ backgroundColor: C.bg, border: fieldBorder(signupFieldErrors.email, C), color: C.text }}
                    />
                  </FieldWrap>
                </div>
                <div>
                  <label className="text-sm block mb-1.5" style={{ color: C.textMuted }}>
                    Role
                  </label>
                  <select
                    value={signupForm.role}
                    onChange={(e) => setSignupForm({ ...signupForm, role: e.target.value })}
                    className="w-full rounded-md px-3 py-2 text-sm outline-none"
                    style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm block mb-1.5" style={{ color: C.textMuted }}>
                    Password
                  </label>
                  <FieldWrap hasError={signupFieldErrors.password} C={C}>
                    <input
                      type="password"
                      value={signupForm.password}
                      onChange={(e) => {
                        setSignupForm({ ...signupForm, password: e.target.value });
                        if (signupFieldErrors.password) setSignupFieldErrors({ ...signupFieldErrors, password: false });
                      }}
                      onKeyDown={(e) => handleKeyDown(e, handleSignupSubmit)}
                      placeholder="At least 6 characters"
                      className="w-full rounded-md px-3 py-2 pr-9 text-sm outline-none"
                      style={{ backgroundColor: C.bg, border: fieldBorder(signupFieldErrors.password, C), color: C.text }}
                    />
                  </FieldWrap>
                </div>

                <button
                  type="button"
                  onClick={handleSignupSubmit}
                  disabled={isSubmitting || !signupFormComplete}
                  className="w-full rounded-md py-2 text-sm font-medium mt-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: C.accent, color: "#1A1300" }}
                >
                  {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                  {isSubmitting ? "Creating account…" : "Create account"}
                </button>
              </div>
            )}

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => {
                  setLoginFieldErrors({});
                  setSignupFieldErrors({});
                  setMode(mode === "signin" ? "signup" : "signin");
                }}
                className="text-sm"
                style={{ color: C.accent }}
              >
                {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: C.textMuted }}>
            © {new Date().getFullYear()} Team Roster. All rights reserved.
          </p>
        </div>
      </div>
    );
  }

  // ---------------- Dashboard ----------------
  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: C.bg, color: C.text, fontFamily: "system-ui, sans-serif" }}
    >
      <ToastCard toast={toast} onClose={() => setToast(null)} C={C} />
      <div style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">Team Roster</h1>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm">{currentMember.name}</div>
              <div className="text-xs flex items-center justify-end" style={{ color: C.textMuted }}>
                <Dot color={isAdmin ? C.blue : C.textMuted} />
                {currentMember.role}
              </div>
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
              style={{ backgroundColor: C.surfaceHover, border: `1px solid ${C.border}` }}
            >
              {initials(currentMember.name)}
            </div>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ color: C.textMuted, border: `1px solid ${C.border}` }}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm"
              style={{ color: C.textMuted }}
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {!isAdmin && (
          <div
            className="rounded-md px-4 py-2.5 mb-5 text-sm flex items-center gap-2"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.textMuted }}
          >
            <Lock size={14} />
            You can view the full roster and edit your own profile. Only admins can add, remove, or reassign roles.
          </div>
        )}

        {feedback && (
          <div
            className="rounded-md px-4 py-2.5 mb-5 text-sm"
            style={{ backgroundColor: C.accentSoft, border: `1px solid ${C.accent}`, color: C.accent }}
          >
            {feedback}
          </div>
        )}

        {storageError && (
          <div
            className="rounded-md px-4 py-2.5 mb-5 text-sm flex items-center gap-2"
            style={{ backgroundColor: C.dangerSoft, border: `1px solid ${C.red}`, color: C.red }}
          >
            <AlertCircle size={14} />
            {storageError}
          </div>
        )}

        {/* Stats strip */}
        <div className="flex gap-8 mb-6">
          <div>
            <div className="text-2xl font-semibold">{members.length}</div>
            <div className="text-xs" style={{ color: C.textMuted }}>Members</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">{totalActive}</div>
            <div className="text-xs" style={{ color: C.textMuted }}>Active</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">{totalAdmins}</div>
            <div className="text-xs" style={{ color: C.textMuted }}>Admins</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: C.textMuted }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or department"
              className="w-full rounded-md pl-9 pr-3 py-2 text-sm outline-none"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}
            />
          </div>
          {isAdmin && (
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap"
              style={{ backgroundColor: C.accent, color: "#1A1300" }}
            >
              <Plus size={15} />
              Add member
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: C.textMuted }}>Name</th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: C.textMuted }}>Department</th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: C.textMuted }}>Role</th>
                <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell" style={{ color: C.textMuted }}>Status</th>
                <th className="text-right px-4 py-2.5 font-medium" style={{ color: C.textMuted }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: C.textMuted }}>
                    No matches for "{search}" — try a different name or email.
                  </td>
                </tr>
              )}
              {filtered.map((m) => {
                const canEdit = isAdmin || m.id === currentMember.id;
                const isSelf = m.id === currentMember.id;
                return (
                  <tr
                    key={m.id}
                    className="transition-colors"
                    style={{ borderBottom: `1px solid ${C.border}` }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
                          style={{ backgroundColor: C.surfaceHover, border: `1px solid ${C.border}` }}
                        >
                          {initials(m.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate">{m.name}{isSelf && <span style={{ color: C.textMuted }}> (you)</span>}</div>
                          <div className="text-xs truncate" style={{ color: C.textMuted }}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: C.textMuted }}>{m.department}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center">
                        <Dot color={m.role === "Admin" ? C.blue : C.textMuted} />
                        {m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="inline-flex items-center">
                        <Dot color={m.status === "Active" ? C.green : C.textMuted} />
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit ? (
                          <button
                            onClick={() => openEdit(m)}
                            className="p-1.5 rounded-md"
                            style={{ color: C.textMuted }}
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                        ) : (
                          <span className="p-1.5" style={{ color: C.border }} title="Only admins can edit other members">
                            <Lock size={14} />
                          </span>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => setConfirmDeleteId(m.id)}
                            className="p-1.5 rounded-md"
                            style={{ color: C.textMuted }}
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div
          className="mt-10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs"
          style={{ borderTop: `1px solid ${C.border}`, color: C.textMuted }}
        >
          <span>© {new Date().getFullYear()} Team Roster. All rights reserved.</span>
          <span>Built for internal team management</span>
        </div>
      </div>

      {/* Add / edit slide-over */}
      {panel && (
        <div className="fixed inset-0 z-20 flex justify-end">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={closePanel}
          />
          <div
            className="relative w-full max-w-sm h-full p-6 overflow-y-auto"
            style={{ backgroundColor: C.surface, borderLeft: `1px solid ${C.border}` }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold">
                {panel.mode === "add" ? "Add member" : "Edit member"}
              </h2>
              <button onClick={closePanel} style={{ color: C.textMuted }}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm block mb-1.5" style={{ color: C.textMuted }}>Name</label>
                <FieldWrap hasError={panelFieldErrors.name} C={C}>
                  <input
                    type="text"
                    value={panel.draft.name}
                    onChange={(e) => {
                      setPanel({ ...panel, draft: { ...panel.draft, name: e.target.value } });
                      if (panelFieldErrors.name) setPanelFieldErrors({ ...panelFieldErrors, name: false });
                    }}
                    className="w-full rounded-md px-3 py-2 pr-9 text-sm outline-none"
                    style={{ backgroundColor: C.bg, border: fieldBorder(panelFieldErrors.name, C), color: C.text }}
                  />
                </FieldWrap>
              </div>
              <div>
                <label className="text-sm block mb-1.5" style={{ color: C.textMuted }}>Email</label>
                <FieldWrap hasError={panelFieldErrors.email} C={C}>
                  <input
                    type="text"
                    value={panel.draft.email}
                    onChange={(e) => {
                      setPanel({ ...panel, draft: { ...panel.draft, email: e.target.value } });
                      if (panelFieldErrors.email) setPanelFieldErrors({ ...panelFieldErrors, email: false });
                    }}
                    className="w-full rounded-md px-3 py-2 pr-9 text-sm outline-none"
                    style={{ backgroundColor: C.bg, border: fieldBorder(panelFieldErrors.email, C), color: C.text }}
                  />
                </FieldWrap>
              </div>

              <div>
                <label className="text-sm block mb-1.5" style={{ color: C.textMuted }}>
                  Department {!isAdmin && <span style={{ color: C.border }}>· admin only</span>}
                </label>
                <FieldWrap hasError={panelFieldErrors.department} C={C}>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={panel.draft.department}
                    onChange={(e) => {
                      setPanel({ ...panel, draft: { ...panel.draft, department: e.target.value } });
                      if (panelFieldErrors.department) setPanelFieldErrors({ ...panelFieldErrors, department: false });
                    }}
                    className="w-full rounded-md px-3 py-2 pr-9 text-sm outline-none disabled:opacity-50"
                    style={{ backgroundColor: C.bg, border: fieldBorder(panelFieldErrors.department, C), color: C.text }}
                  />
                </FieldWrap>
              </div>

              <div>
                <label className="text-sm block mb-1.5" style={{ color: C.textMuted }}>
                  Role {!isAdmin && <span style={{ color: C.border }}>· admin only</span>}
                </label>
                <select
                  disabled={!isAdmin}
                  value={panel.draft.role}
                  onChange={(e) => setPanel({ ...panel, draft: { ...panel.draft, role: e.target.value } })}
                  className="w-full rounded-md px-3 py-2 text-sm outline-none disabled:opacity-50"
                  style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm block mb-1.5" style={{ color: C.textMuted }}>
                  Status {!isAdmin && <span style={{ color: C.border }}>· admin only</span>}
                </label>
                <select
                  disabled={!isAdmin}
                  value={panel.draft.status}
                  onChange={(e) => setPanel({ ...panel, draft: { ...panel.draft, status: e.target.value } })}
                  className="w-full rounded-md px-3 py-2 text-sm outline-none disabled:opacity-50"
                  style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                >
                  <option>Active</option>
                  <option>Invited</option>
                </select>
              </div>

              {panelError && (
                <div className="flex items-center gap-1.5 text-sm" style={{ color: C.red }}>
                  <AlertCircle size={14} />
                  {panelError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={savePanel}
                  className="flex-1 rounded-md py-2 text-sm font-medium"
                  style={{ backgroundColor: C.accent, color: "#1A1300" }}
                >
                  {panel.mode === "add" ? "Add member" : "Save changes"}
                </button>
                <button
                  onClick={closePanel}
                  className="flex-1 rounded-md py-2 text-sm"
                  style={{ border: `1px solid ${C.border}`, color: C.text }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-6">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setConfirmDeleteId(null)}
          />
          <div
            className="relative w-full max-w-sm rounded-lg p-6"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
          >
            <h3 className="text-base font-semibold mb-2">Remove this member?</h3>
            <p className="text-sm mb-5" style={{ color: C.textMuted }}>
              {members.find((m) => m.id === confirmDeleteId)?.name} will lose access to the roster. This can't be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => deleteMember(confirmDeleteId)}
                className="flex-1 rounded-md py-2 text-sm font-medium"
                style={{ backgroundColor: C.red, color: "#1A0000" }}
              >
                Remove
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded-md py-2 text-sm"
                style={{ border: `1px solid ${C.border}`, color: C.text }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
