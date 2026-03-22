import type { Route } from "./+types/home";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <div className="text-2xl font-bold" onClick={() => {
    console.log("Home");
  }}>Home
    <div className="transition-colors duration-300 hover:text-blue-500">
      Hover Me
    </div>
  </div>

}
