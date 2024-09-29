import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function Header() {
  return (
    <header>
      <nav>
        <SignInButton />
        <SignUpButton />
        <UserButton afterSignOutUrl="/" />
      </nav>
    </header>
  )
}
