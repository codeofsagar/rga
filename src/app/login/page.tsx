// // app/login/page.tsx
// 'use client';
// import { useState } from 'react';
// import { signInWithEmailAndPassword } from 'firebase/auth';
// import { auth } from '../lib/firebase';
// import { useRouter } from 'next/navigation';

// export default function LoginPage() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const router = useRouter();

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       await signInWithEmailAndPassword(auth, email, password);
//       // Logic: If email matches env var, they are admin
//       if (email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
//         router.push('/admin');
//       } else {
//         alert("You are logged in, but you are not an admin.");
//       }
//     } catch (error) {
//       alert("Invalid login.");
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-slate-100">
//       <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-md w-96">
//         <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
//         <input 
//           type="email" 
//           placeholder="Email" 
//           className="w-full p-3 mb-4 border rounded"
//           onChange={e => setEmail(e.target.value)}
//         />
//         <input 
//           type="password" 
//           placeholder="Password" 
//           className="w-full p-3 mb-6 border rounded"
//           onChange={e => setPassword(e.target.value)}
//         />
//         <button className="w-full bg-slate-900 text-white py-3 rounded font-bold">
//           Login
//         </button>
//       </form>
//     </div>
//   );
// }
export default function Login() {
  return <div>Admin page coming soon</div>;
}
