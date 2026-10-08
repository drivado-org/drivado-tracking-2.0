import DrivadoLogo from "@/assets/images/drivado_logo-189x56.png";

interface DashboardHeaderProps {
  isExpanded: boolean;
  onToggle: () => void;
}

const DashboardHeader = ({ isExpanded, onToggle }: DashboardHeaderProps) => {
  return (
    <div className="relative h-0 md:hidden">
      {/* Drivado Logo */}
      <div className="absolute -top-9 left-5 z-10 flex h-12 w-32 items-center justify-center rounded-t-[18px] rounded-br-[18px] bg-white">
        <img
          src={DrivadoLogo}
          alt="Drivado"
          className="max-h-14 max-w-24 object-contain"
        />
      </div>

      {/* Grey Toggle Handle */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={isExpanded ? "Collapse dashboard" : "Expand dashboard"}
        className="absolute left-1/2 top-0 z-10 -translate-x-1/2 px-6 py-3"
      >
        <span className="block h-1 w-11 rounded-full bg-slate-300 transition-colors hover:bg-slate-400" />
      </button>
    </div>
  );
};

export default DashboardHeader;
