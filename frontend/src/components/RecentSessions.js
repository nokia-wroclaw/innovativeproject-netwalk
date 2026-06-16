import "./RecentSessions.css";

export default function RecentSessions({
  sessions,
  selectedSession,
  setSelectedSession,
}) {
  return (
    <section className="card recent-sessions">
      <h3>Sesje pomiarowe</h3>

      <select
        className="session-select"
        value={selectedSession?.session_id || ""}
        onChange={(event) => {
          const session = sessions.find(
            (item) => item.session_id === event.target.value
          );

          setSelectedSession(session || null);
        }}
      >
        <option value="">Wszystkie sesje</option>

        {sessions.map((session) => (
          <option
            key={session.session_id}
            value={session.session_id}
          >
            {session.session_id}
          </option>
        ))}
      </select>
    </section>
  );
}