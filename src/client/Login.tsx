import { useState } from 'react';
const apiUrl = import.meta.env.VITE_API_BASE_URL;

function Login({
  onLoginSuccess,
}: {
  onLoginSuccess: (accessToken: string) => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/api/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'System@bonbloc.com',
          password: 'Mctrace@2024',
        }),
      });

      const data = await response.json();
      console.log(data);
      onLoginSuccess(data.access_token);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col p-4 space-y-2">
      <input
        type="text"
        className="border rounded-md p-1"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        className="border rounded-md p-1"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        type="submit"
        className="border rounded-md p-1 bg-neutral-700 text-white hover:bg-neutral-600 transition-all duration-100 hover:font-semibold"
      >
        Login
      </button>
    </form>
  );
}

export default Login;
