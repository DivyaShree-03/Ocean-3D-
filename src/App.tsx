import { OceanViewport } from './components/explorer/OceanViewport';

export function App() {
  return (
    <div className="w-screen h-screen relative bg-[#0B1D33] text-[#152235] overflow-hidden font-sans select-none">
      <main className="w-full h-full relative overflow-hidden bg-[#0B1D33]">
        <OceanViewport />
      </main>
    </div>
  );
}

export default App;
