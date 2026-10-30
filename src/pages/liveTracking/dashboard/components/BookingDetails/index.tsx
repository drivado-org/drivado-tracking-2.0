import { BriefcaseBusiness, Headphones, User } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export interface BookingData {
  passengerName: string;
  companyName: string;
  passengers: number;
  luggage: number;
  flightNo: string;
}

interface BookingDetailsProps {
  booking: BookingData;
}

const BookingDetails = ({ booking }: BookingDetailsProps) => {
  const { passengerName, companyName, passengers, luggage, flightNo } = booking;

  const initials = passengerName
    .split(" ")
    .map((name) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Accordion type="single" collapsible className="mx-4 mt-2">
      <AccordionItem
        value="booking"
        className="rounded-2xl border-0 bg-white px-4 py-1 shadow-sm"
      >
        <AccordionTrigger className="py-2.5 text-left hover:no-underline">
          <h2 className="text-sm font-semibold text-slate-800">Your booking</h2>
        </AccordionTrigger>

        <AccordionContent>
          <div>
            {/* Passenger details */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e4e1e4] bg-[#f8f6f7] text-[13px] font-medium text-[#25262b]">
                {initials}
              </div>

              <div className="text-left">
                <p className="text-[14px] font-semibold leading-5 text-[#22242a]">
                  {passengerName}
                </p>

                <p className="text-[13px] leading-5 text-[#737887]">
                  {companyName}
                </p>
              </div>
            </div>

            {/* Passengers and luggage */}
            <div className="mb-3 grid grid-cols-2 gap-2 text-left">
              <div className="rounded-xl bg-[#f7f4f5] px-3 py-2">
                <div className="flex items-center gap-1">
                  <User className="size-3.5 text-[#72757e]" />
                  <p className="mb-1 text-[12px] text-[#747887]">Passengers</p>
                </div>

                <p className="text-[13px] font-medium text-[#202127]">
                  {passengers}
                </p>
              </div>

              <div className="rounded-xl bg-[#f7f4f5] px-3 py-2">
                <div className="flex items-center gap-1">
                  <BriefcaseBusiness className="size-3.5 text-[#72757e]" />
                  <p className="mb-1 text-[12px] text-[#747887]">Luggage</p>
                </div>

                <p className="text-[13px] font-medium text-[#202127]">
                  {luggage} {luggage === 1 ? "piece" : "pieces"}{" "}
                  {luggage === 3 ? (
                    <span className="text-[10px] text-[#747887]">
                      (Standard size)
                    </span>
                  ) : null}
                </p>
              </div>
            </div>

            {/* Flight details */}
            <div className="mb-2 border-t border-[#e8e5e6]" />

            <div className="mb-4 flex items-center justify-between">
              <span className="text-[13px] text-[#707583]">Flight</span>

              <span className="text-[13px] font-medium text-[#25262b]">
                {flightNo}
              </span>
            </div>

            {/* Contact support */}
            <Button
              type="button"
              className="flex h-11.25 w-full items-center justify-center gap-2 rounded-xl bg-[#101216] text-[14px] font-semibold text-white transition hover:bg-[#1d1f24] cursor-pointer"
            >
              <Headphones size={16} strokeWidth={2} />
              <span>Contact support</span>
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default BookingDetails;
