import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export interface JourneyData {
  distance: string;
  duration: string;
  pickup: {
    pickupLocation: string;
    address: string;
  };
  dropoff: {
    dropoffLocation: string;
    address: string;
  };
}

interface JourneyDetailsProps {
  journey: JourneyData;
}

const JourneyDetails = ({ journey }: JourneyDetailsProps) => {
  const { distance, duration, pickup, dropoff } = journey;

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="journey"
      className="mx-4"
    >
      <AccordionItem
        value="journey"
        className="rounded-2xl border-0 bg-white px-4 shadow-sm"
      >
        <AccordionTrigger className="py-3 text-left hover:no-underline">
          <div className="flex w-full items-center justify-between gap-3 pr-2">
            <h2 className="text-sm font-semibold text-slate-800">
              Journey details
            </h2>

            <span className="text-xs font-medium text-slate-500">
              {distance}
            </span>
          </div>
        </AccordionTrigger>

        <AccordionContent>
          <div className="pt-1">
            {/* Pickup */}
            <div className="relative flex gap-3 text-left">
              <div className="relative flex w-2 shrink-0 justify-center">
                <span className="absolute left-1/2 top-2 h-[calc(100%+18px)] w-px -translate-x-1/2 border-l border-dashed border-slate-300" />

                <span className="relative z-10 mt-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-800 bg-white" />
              </div>

              <div className="pb-4">
                <p className="text-xs font-medium text-slate-500">Pickup</p>

                <p className="mt-1 text-sm font-semibold leading-5 text-slate-800">
                  {pickup.pickupLocation}
                </p>

                <p className="text-xs leading-5 text-slate-500">
                  {pickup.address}
                </p>
              </div>
            </div>

            {/* Drop-off */}
            <div className="relative flex gap-3 text-left">
              <div className="relative flex w-2 shrink-0 justify-center">
                <span className="relative z-10 mt-1 h-2.5 w-2.5 rounded-xs bg-slate-900" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">Drop-off</p>

                <p className="mt-1 text-sm font-semibold leading-5 text-slate-800">
                  {dropoff.dropoffLocation}
                </p>

                <p className="text-xs leading-5 text-slate-500">
                  {dropoff.address}
                </p>
              </div>
            </div>

            {/* Estimated duration */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-2">
              <span className="text-xs font-medium text-slate-500">
                Est. duration
              </span>

              <p className="text-[13px] font-bold text-slate-800">{duration}</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default JourneyDetails;
