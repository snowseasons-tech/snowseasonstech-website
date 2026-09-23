import { Header } from "./header";
import { Footer } from "./footer";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return <><Header /><main>{children}</main><Footer /></>;
}
