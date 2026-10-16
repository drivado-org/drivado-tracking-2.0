import DrivadoLogo from "@/assets/images/drivado_logo-189x56.png";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  isExpanded: boolean;
  handleToggle: () => void;
}

const DashboardHeader = ({
  isExpanded,
  handleToggle,
}: DashboardHeaderProps) => {
  return (
    <div className="relative z-20 h-0 shrink-0 overflow-visible md:flex md:h-14 md:items-center md:bg-white md:px-5">
      {/* Drivado Logo */}
      <div className="absolute -top-9 left-5 flex h-12 w-32 items-center justify-center rounded-t-[18px] rounded-br-[18px] bg-white md:static md:top-auto md:text-left">
        <img
          src={DrivadoLogo}
          alt="Drivado"
          className="max-h-14 max-w-24 object-contain"
        />
      </div>

      {/* Grey Toggle Handle */}
      <Button
        type="button"
        onClick={handleToggle}
        aria-label={isExpanded ? "Collapse dashboard" : "Expand dashboard"}
        aria-expanded={isExpanded}
        className="absolute left-1/2 top-0 -translate-x-1/2 px-6 py-3 md:hidden"
      >
        <span className="block h-1 w-11 rounded-full bg-slate-300 transition-colors hover:bg-slate-400" />
      </Button>
    </div>
  );
};

export default DashboardHeader;
