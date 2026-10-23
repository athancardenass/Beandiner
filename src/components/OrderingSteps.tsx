export function OrderingSteps({ handoff = false }: { handoff?: boolean }) {
  const steps = handoff
    ? [
        ["Review Order", "Check the items, contact details, and timing below"],
        ["Open WhatsApp", "Your message is prefilled. For long orders, copy and paste the summary"],
        ["Send Request", "Tap Send in WhatsApp, then wait for our crew to confirm your order"],
      ]
    : [
        ["Choose Your Sips & Bites", "Explore signature iced roasts and comfort kitchen plates"],
        ["Pick Order Mode", "For pick up, Dine in with table #, or Door to door delivery"],
        ["Send on WhatsApp", "Send your formatted order request and wait for our crew to confirm"],
      ];

  return (
    <ol className={`ordering-steps${handoff ? " ordering-steps-handoff" : ""}`} aria-label={handoff ? "Send your order in three steps" : "How social ordering works"}>
      {steps.map(([title, description], index) => (
        <li key={title}>
          <span className="ordering-step-number" aria-hidden="true">{index + 1}</span>
          <div>
            <h3><span className="sr-only">{index + 1}. </span>{title}</h3>
            <p>{description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
