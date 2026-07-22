import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-pulse text-gray-400">Loading...</div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
