import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://localhost:3000/api';

type User = {
  userId?: string;
  _id?: string;
  name?: string;
  email: string;
  role: string;
};

type Note = {
  _id: string;
  title: string;
  content: string;
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState<User | null>(
    JSON.parse(localStorage.getItem('user') || 'null'),
  );

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminNotes, setAdminNotes] = useState<Note[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);

  const client = axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` },
  });

  async function authenticate() {
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';

      const response = await axios.post(`${API}${endpoint}`, {
        ...(isRegister ? { name } : {}),
        email,
        password,
      });

      if (isRegister) {
        setMessage('Registration successful. Please log in.');
        setIsRegister(false);
        return;
      }

      const receivedToken = response.data.access_token;
      const receivedUser = response.data.user;

      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);
      setMessage('Login successful!');
   } catch (error: any) {
  console.log('Authentication error:', error.response?.data || error);

  const errorMessage = error.response?.data?.message;

  setMessage(
    Array.isArray(errorMessage)
      ? errorMessage.join(', ')
      : errorMessage || error.message || 'Authentication failed.',
  );
}
  }

  async function loadNotes() {
    try {
      const response = await client.get('/notes?page=1&limit=20');
      setNotes(response.data.data || []);
    } catch {
      setMessage('Could not load notes.');
    }
  }

  async function saveNote() {
    try {
      if (editingId) {
        await client.patch(`/notes/${editingId}`, { title, content });
        setMessage('Note updated.');
      } else {
        await client.post('/notes', { title, content });
        setMessage('Note created.');
      }

      setTitle('');
      setContent('');
      setEditingId(null);
      await loadNotes();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Could not save note.');
    }
  }

  function editNote(note: Note) {
    setEditingId(note._id);
    setTitle(note.title);
    setContent(note.content);
  }

  async function deleteNote(id: string) {
    if (!window.confirm('Delete this note?')) return;

    try {
      await client.delete(`/notes/${id}`);
      setMessage('Note deleted.');
      await loadNotes();
    } catch {
      setMessage('Could not delete note.');
    }
  }

  async function loadAdminData() {
    try {
      const [usersResponse, notesResponse] = await Promise.all([
        client.get('/admin/users?page=1&limit=20'),
        client.get('/notes/admin/all?page=1&limit=20'),
      ]);

      setAdminUsers(usersResponse.data.data || []);
      setAdminNotes(notesResponse.data.data || []);
      setShowAdmin(true);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Could not load admin data.');
    }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setNotes([]);
    setShowAdmin(false);
  }

  useEffect(() => {
    if (token) loadNotes();
  }, [token]);

  if (!token || !user) {
  return (
    <div className="auth-page">
      <div className="auth-shell">

        <section className="auth-visual">
          <div className="brand">
            <div className="brand-icon">S</div>
            <span>SecureNotes</span>
          </div>

          <div className="visual-content">
            <span className="eyebrow">YOUR PRIVATE SPACE</span>
            <h1>
              Your thoughts.
              <br />
              Your notes.
              <br />
              <span>Your privacy.</span>
            </h1>

            <p>
              A simple and secure place to organize your thoughts,
              save important information, and keep everything
              in one place.
            </p>

            <div className="feature-list">
              <div>✓ &nbsp; Private and secure notes</div>
              <div>✓ &nbsp; Easy note management</div>
              <div>✓ &nbsp; Access anytime, anywhere</div>
            </div>
          </div>

          <div className="visual-footer">
            <span>SECURE NOTES APPLICATION</span>
            <span>© 2026</span>
          </div>
        </section>

        <section className="auth-form-section">
          <div className="auth-form-wrapper">

            <div className="mobile-brand">
              <div className="brand-icon">S</div>
              <span>SecureNotes</span>
            </div>

            <div className="form-heading">
              <span className="form-tag">
                {isRegister ? 'GET STARTED' : 'WELCOME BACK'}
              </span>

              <h2>
                {isRegister ? 'Create your account' : 'Welcome back!'}
              </h2>

              <p>
                {isRegister
                  ? 'Create an account to start managing your notes.'
                  : 'Enter your details to access your private notes.'}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                authenticate();
              }}
            >
              {isRegister && (
                <div className="form-group">
                  <label>Full name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>

              {message && (
                <div className="auth-message">
                  {message}
                </div>
              )}

              <button type="submit" className="auth-submit">
                {isRegister ? 'Create Account' : 'Sign In'}
                <span>→</span>
              </button>
            </form>

            <div className="auth-switch">
              {isRegister
                ? 'Already have an account?'
                : "Don't have an account?"}

              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setMessage('');
                }}
              >
                {isRegister ? 'Sign in' : 'Create account'}
              </button>
            </div>

            <div className="security-note">
              <span>🔒</span>
              Your information is protected and secure.
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}

  return (
  <main className="dashboard-page">
    <header className="dashboard-header">
      <div className="dashboard-brand">
        <div className="brand-icon">S</div>
        <span>SecureNotes</span>
      </div>

      <div className="header-right">
        <div className="user-info">
          <div className="user-avatar">
            {(user.name || user.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{user.name || user.email}</strong>
            <small>{user.role}</small>
          </div>
        </div>

        {user.role === 'admin' && (
          <button
            className="admin-button"
            onClick={loadAdminData}
          >
            Admin Panel
          </button>
        )}

        <button className="logout-button" onClick={logout}>
          Logout ↗
        </button>
      </div>
    </header>

    <div className="dashboard-content">
      {message && <div className="dashboard-message">{message}</div>}

      {showAdmin ? (
        <section className="admin-section">
          <div className="section-heading">
            <div>
              <span className="section-label">ADMINISTRATION</span>
              <h1>Admin Dashboard</h1>
              <p>Manage users and review notes across the application.</p>
            </div>
            <button
              className="back-button"
              onClick={() => setShowAdmin(false)}
            >
              ← Back to notes
            </button>
          </div>

          <h2>Registered Users</h2>
          <div className="dashboard-grid">
            {adminUsers.map((item) => (
              <article className="dashboard-card" key={item._id || item.userId}>
                <div className="card-top">
                  <div className="note-icon">👤</div>
                  <span className="role-label">{item.role}</span>
                </div>
                <h3>{item.name || item.email}</h3>
                <p>{item.email}</p>
              </article>
            ))}
          </div>

          <h2 className="admin-notes-heading">All Users' Notes</h2>
          <div className="dashboard-grid">
            {adminNotes.map((note) => (
              <article className="dashboard-card" key={note._id}>
                <div className="note-icon">📝</div>
                <h3>{note.title}</h3>
                <p>{note.content}</p>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="welcome-section">
            <div>
              <span className="section-label">YOUR PERSONAL WORKSPACE</span>
              <h1>Your Notes</h1>
              <p>Capture your ideas. Keep your thoughts organized.</p>
            </div>
            <div className="notes-counter">
              <span>{notes.length}</span>
              <small>{notes.length === 1 ? 'Note' : 'Notes'}</small>
            </div>
          </section>

          <section className="editor-card">
            <div className="editor-heading">
              <div className="note-icon">✎</div>
              <div>
                <h2>{editingId ? 'Edit your note' : 'Create a new note'}</h2>
                <p>
                  {editingId
                    ? 'Make changes to your existing note.'
                    : 'Write down something worth remembering.'}
                </p>
              </div>
            </div>

            <div className="editor-fields">
              <input
                placeholder="Give your note a title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <textarea
                placeholder="Start writing your thoughts here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
              />
            </div>

            <div className="editor-actions">
              {editingId && (
                <button
                  className="cancel-button"
                  onClick={() => {
                    setEditingId(null);
                    setTitle('');
                    setContent('');
                  }}
                >
                  Cancel
                </button>
              )}

              <button
                className="save-button"
                onClick={saveNote}
                disabled={!title.trim() || !content.trim()}
              >
                {editingId ? 'Update Note' : '+ Save Note'}
              </button>
            </div>
          </section>

          <section className="notes-section">
            <div className="notes-heading">
              <div>
                <h2>All Notes</h2>
                <p>Your saved thoughts and ideas.</p>
              </div>
            </div>

            {notes.length > 0 ? (
              <div className="dashboard-grid">
                {notes.map((note) => (
                  <article className="dashboard-card" key={note._id}>
                    <div className="card-top">
                      <div className="note-icon">📝</div>
                      <span className="private-label">PRIVATE</span>
                    </div>

                    <h3>{note.title}</h3>
                    <p>{note.content}</p>

                    <div className="card-actions">
                      <button onClick={() => editNote(note)}>
                        Edit
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => deleteNote(note._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">✎</div>
                <h3>No notes yet</h3>
                <p>Your notes will appear here. Create your first one above.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>

    <footer className="dashboard-footer">
      <span>SecureNotes © 2026</span>
      <span>Built with privacy in mind 🔒</span>
    </footer>
  </main>
);
}