import CountryTypeahead from "./_components/TypeHeadSearch";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans">
      <CountryTypeahead />
    </div>
  );
}
