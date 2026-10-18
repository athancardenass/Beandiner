export default function OurStoryPage() {
  return (
    <section className="brand-story our-story-page" aria-labelledby="our-story-title">
      <div className="brand-photo reveal">
        <img
          src="./images/menu/diner-showcase.webp"
          alt="Refreshing Bean Diner signature ice drinks served at Bayambang café"
          loading="eager"
          width="1000"
          height="750"
        />
        <span className="photo-note handwritten">
          Good coffee tastes better when it’s shared. Tara, kape tayo sa Bean Diner.
        </span>
      </div>
      <div className="brand-copy reveal">
        <h1 id="our-story-title">
          Not just coffee.
          <br />A true <em>diner home.</em>
        </h1>
        <p>
          Bean Diner was founded by a Chef trained in the culinary kitchens
          of the US and a Barista skilled in the specialty coffee culture of
          the Middle East.
        </p>
        <p>
          Right here on Gen. Antonio Luna Street in Bayambang, we bring
          together honest comfort food—from our ₱99 student-budget honey
          butter wings to loaded Mexican nachos—with specialty third-wave
          coffee brewed from Benguet highland farms and creamy Oatside oat
          milk.
        </p>
        <span className="brand-signature handwritten">Tara, kain at kape tayo.</span>
      </div>
    </section>
  );
}
