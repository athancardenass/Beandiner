import { spawn } from "child_process";
import fs from "fs";

async function run() {
  const edge = "C:\\Program Files (x86)\\Microsoft\\EdgeCore\\153.0.4234.48\\msedge.exe";
  const proc = spawn(edge, [
    "--headless",
    "--disable-gpu",
    "--remote-debugging-port=9222",
    "--window-size=390,844",
    "http://localhost:5173"
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  const res = await fetch("http://localhost:9222/json");
  const tabs = await res.json();
  const tab = tabs.find((t) => t.url.includes("5173"));
  if (!tab) {
    console.log("No tab found");
    proc.kill();
    return;
  }

  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const curId = id++;
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === curId) {
          ws.removeEventListener("message", handler);
          resolve(data.result);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

  ws.onopen = async () => {
    console.log("Connected to CDP");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });

    // 1. Hero
    await send("Runtime.evaluate", { expression: "window.scrollTo(0, 0)" });
    await new Promise((r) => setTimeout(r, 500));
    const shot0 = await send("Page.captureScreenshot");
    fs.writeFileSync(
      "C:/Users/Menaze/Documents/samploes/sayav2/public/images/optimized/mobile_hero.png",
      Buffer.from(shot0.data, "base64")
    );

    // 2. Story
    await send("Runtime.evaluate", {
      expression: "document.querySelector('#flavors')?.scrollIntoView()",
    });
    await new Promise((r) => setTimeout(r, 600));
    const shot1 = await send("Page.captureScreenshot");
    fs.writeFileSync(
      "C:/Users/Menaze/Documents/samploes/sayav2/public/images/optimized/mobile_story.png",
      Buffer.from(shot1.data, "base64")
    );

    // 3. Menu
    await send("Runtime.evaluate", {
      expression: "document.querySelector('#menu')?.scrollIntoView()",
    });
    await new Promise((r) => setTimeout(r, 600));
    const shot2 = await send("Page.captureScreenshot");
    fs.writeFileSync(
      "C:/Users/Menaze/Documents/samploes/sayav2/public/images/optimized/mobile_menu.png",
      Buffer.from(shot2.data, "base64")
    );

    // 4. Bites
    await send("Runtime.evaluate", {
      expression: "document.querySelector('#bites')?.scrollIntoView()",
    });
    await new Promise((r) => setTimeout(r, 600));
    const shotBites = await send("Page.captureScreenshot");
    fs.writeFileSync(
      "C:/Users/Menaze/Documents/samploes/sayav2/public/images/optimized/mobile_bites.png",
      Buffer.from(shotBites.data, "base64")
    );

    // 5. Together / Offer
    await send("Runtime.evaluate", {
      expression: "document.querySelector('#together')?.scrollIntoView()",
    });
    await new Promise((r) => setTimeout(r, 600));
    const shotTogether = await send("Page.captureScreenshot");
    fs.writeFileSync(
      "C:/Users/Menaze/Documents/samploes/sayav2/public/images/optimized/mobile_together.png",
      Buffer.from(shotTogether.data, "base64")
    );

    // 6. Footer
    await send("Runtime.evaluate", {
      expression: "document.querySelector('footer')?.scrollIntoView()",
    });
    await new Promise((r) => setTimeout(r, 600));
    const shot3 = await send("Page.captureScreenshot");
    fs.writeFileSync(
      "C:/Users/Menaze/Documents/samploes/sayav2/public/images/optimized/mobile_footer.png",
      Buffer.from(shot3.data, "base64")
    );

    console.log("All screenshots saved!");
    proc.kill();
    process.exit(0);
  };
}
run();
