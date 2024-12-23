import { skaiLogo } from "./assets/skaiLogo";

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="flex flex-col items-center">
          <img
            src={skaiLogo}
            alt="SKAI Accessories"
            className="h-16 w-auto mb-4"
          />
          <h2 className="text-2xl font-bold">Sign in to your account</h2>
        </div>
        {/* Login form */}
      </div>
    </div>
  );
};
