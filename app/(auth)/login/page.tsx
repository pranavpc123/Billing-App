import Image from "next/image";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <div className="relative hidden w-1/2 items-center justify-center bg-navy-600 md:flex">
        <Image
          src="/logo-card.png"
          alt="DELSORA — Designer Boutique & Makeover Studio"
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />
      </div>
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center md:items-start md:text-left">
            <Image
              src="/logo-mark.png"
              alt="DELSORA"
              width={64}
              height={64}
              className="mb-4 rounded-xl"
            />
            <h1 className="font-serif text-2xl font-semibold text-navy-500">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-navy-300">
              Sign in to the DELSORA billing counter
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
