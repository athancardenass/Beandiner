# Asset provenance and regeneration

## Actual generation method and limits
Eight source images were genuinely generated using the image-generation tool available in this environment. The tool does not expose its underlying model identifier or a separate commercial output license. We therefore DO NOT claim these were generated with Qwen, FLUX, Wan, or another named open model, and DO NOT assert a verified commercial license for the supplied generator. Commercial deployment requires confirming the provider's output terms or regenerating the assets using an independently verified model/runtime.

Before generation, the model repository license for Qwen-Image was checked: https://huggingface.co/Qwen/Qwen-Image/raw/main/LICENSE (Apache 2.0). Wan2.1 I2V 14B 480P was also checked: https://huggingface.co/Wan-AI/Wan2.1-I2V-14B-480P/raw/main/LICENSE.txt (Apache 2.0). These permit commercial use subject to license terms; model licenses do not guarantee all outputs are free of third-party rights. They were practical regeneration candidates, NOT the models used by the supplied tool. No local GPU/image-to-video runtime was available. Rather than misrepresenting CSS motion as AI video, this build uses an honestly credited, licensed stock video alongside genuinely generated images and independent CSS/SVG motion. No downloaded model weights or AI inference dependencies are required to run the site.

## Original prompts
All cup prompts share: premium commercial beverage product photography cutout; entire cup visible with generous margins; single object isolated on pure solid white, no ground shadow or scenery; warm studio lighting; straight-on camera with slightly elevated lid view; premium Filipino coffee campaign; photoreal crisp detail; portrait 3:4. The red lowercase chunky retro serif saya wordmark and small A LITTLE CUP OF HAPPY text are repeated across packaging. These descriptions are the source generation instructions, not claims of actual ingredients or sourcing.

### public/images/saya-latte.png
Single tall clear plastic iced latte, clear flat lid, no straw. Espresso caramel top swirling into creamy milk below, translucent ice and condensation. Bold RED saya in chunky lowercase serif and small red A LITTLE CUP OF HAPPY below. Slight 10-degree clockwise tilt. White isolated background, no additional objects. Sunlit warm studio lighting.

### public/images/saya-ube.png
Single tall clear plastic iced ube latte, clear flat lid, no straw. Purple ube bottom, light lavender milk middle, espresso caramel top, ice and condensation. Same RED saya and tagline. Upright, isolated on pure white, premium warm studio photography.

### public/images/saya-matcha.png
Single tall clear iced matcha latte, clear flat lid, no straw. Deep fresh matcha green top swirling into creamy white milk, ice and condensation. Same RED saya and tagline. Slight 8-degree counterclockwise tilt, isolated white, warm studio photography.

### public/images/saya-spanish.png
Single tall clear iced Spanish latte, clear flat lid, no straw. Golden espresso top and rich creamy pale condensed-milk lower layer, ice and condensation. Same RED saya and tagline, entire cup with margins, isolated white, warm studio photography.

### public/images/saya-barako.png
Single warm cream paper hot takeaway coffee cup with dark coffee-brown lid, medium size. Same RED saya and tagline, tiny red coffee-bean illustration beneath. Entire cup visible, isolated pure white, no ground shadow or scenery, warm studio photography.

### public/images/saya-coldbrew.png
Single tall clear iced black cold brew with clear flat lid, no straw. Deep dark translucent brown coffee, amber edges, NO milk, realistic ice and condensation. CREAM saya wordmark and tagline for contrast. Entire cup visible, isolated pure white, warm studio photography.

### public/images/ingredient-sheet.png
Clean 2 by 2 sprite sheet on pure white; four separated objects with generous blank space. Top left: single stylized roasted brown coffee bean with curved cream center line and textured gouache. Top right: curved sprig of dark forest-green coffee leaves, textured hand-painted gouache. Bottom left: red coffee cherries with green leaf/stem, gouache. Bottom right: pale frosty blue rounded ice cube, gouache. Elevated playful editorial illustration, organic bold clean silhouettes, subtle paper grain, mint/coral/brown palette. No text or labels; objects centered within quadrants.

### public/images/saya-merienda.png
Premium Filipino editorial coffee campaign. Close overhead table scene in warm direct afternoon sun with hard shadows: Filipino young adults' hands reaching toward two clear iced latte cups with bold red lowercase serif saya logos; crumpled cream bakery paper with golden pandesal; mint-green outdoor table; one hand holds a cup; red/cream striped fabric at left. Candid relaxed coffee break; warm nostalgic 35mm aesthetic, contemporary; landscape 4:3.

Note: generator files use .png paths, but the tool returned JPEG-encoded originals. Sharp detects their format by file signature. These source files are retained for regeneration and auditing; the UI serves actual optimized WebP files only.

## Reusable pipeline
Idea and palette -> generator prompt -> inspect -> isolate white background using an edge-connected flood-fill alpha mask -> split ingredient quadrants -> crop to alpha bounds -> resize -> WebP -> independent HTML image layers -> transform/opacity CSS/JS choreography.

Run node scripts/prepare-assets.mjs. Outputs: public/images/optimized/{latte,spanish,ube,barako,matcha,coldbrew,bean,leaf,cherry,ice,merienda}.webp. Ingredients remain independent images, not a flattened hero. Cutouts are not manually traced SVGs. Simple sun/arrow/cart symbols are original inline SVG, not AI-generated. Background curves and decorative shapes are CSS/SVG. No placeholders are presented as artwork.

## Video
Source: Tima Miroshnichenko, Pouring Coffee From a Coffee Maker, Pexels #4957763.
Page: https://www.pexels.com/video/pouring-coffee-from-a-coffee-maker-4957763/
Original: https://videos.pexels.com/video-files/4957763/4957763-hd_1920_1080_25fps.mp4
License: https://www.pexels.com/license/ (free commercial/personal use subject to restrictions; no implied endorsement).
Local adaptations: 12-second, 854x480, 24fps, silent MP4 H.264 CRF29 with faststart; VP9 WebM CRF38; JPEG poster. Created with ffmpeg-static, a development-only asset-processing tool. No encoder binary is shipped in the frontend. Playback is user-initiated from the coffee-break film control; the video element is not mounted or downloaded before interaction. Both native controls and download fallback are available. The footage is clearly stock, not AI-generated or filmed for Saya. There is no speech or omitted soundtrack requiring captions; an accessible visual description is supplied.

Example regeneration: ffmpeg -i input.mp4 -t 12 -vf 'scale=854:-2,fps=24' -c:v libx264 -crf 29 -preset fast -an -movflags +faststart coffee-break.mp4; ffmpeg -i coffee-break.mp4 -c:v libvpx-vp9 -b:v 0 -crf 38 -an coffee-break.webm.
