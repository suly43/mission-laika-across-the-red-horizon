# Credits and Sources

This project is an educational, independent game inspired by NASA open data. It is not an official NASA product or endorsement.

## NASA data and science

- **NASA Open APIs / DONKI** — https://api.nasa.gov/ . DONKI documents `CME`, `GST`, `FLR`, and `SEP` endpoints with `startDate`, `endDate`, and `api_key` parameters. Used to count recent event records as a simplified in-game space-weather risk indicator. API records are not a Mars forecast.
- **NASA Images API** — https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf and https://images-api.nasa.gov/search . Used to find public NASA archive images. Images are credited NASA/JPL-Caltech where identified in the source record.
- **NASA Mars Rover Photos API notice** — https://api.nasa.gov/ . NASA's page notes that this legacy API has been archived. The game does not label its contents live.
- **Curiosity Radiation Assessment Detector (RAD)** — https://science.nasa.gov/resource/radiation-measurements-on-mars/ and https://science.nasa.gov/mission/msl-curiosity/science-instruments/ . Source for the Mars radiation instrument and shielding context.
- **Mars radiation protection** — https://science.nasa.gov/resource/real-martians-how-to-protect-astronauts-from-space-radiation-on-mars/ . Source for Mars having no global magnetic field and a thinner atmosphere than Earth.
- **Mars facts** — https://science.nasa.gov/mars/facts/ . Source for the thin carbon-dioxide atmosphere and Mars temperature range.
- **Solar-powered Mars rovers** — https://science.nasa.gov/planetary-science/programs/radioisotope-power-systems/missions/ . NASA describes Spirit and Opportunity as solar-powered.
- **Mars temperatures** — https://science.nasa.gov/solar-system/temperatures-across-our-solar-system/ . NASA reports a median Mars surface temperature near −65°C and a range from around 20°C to −153°C.
- **Mars communication delay** — https://science.nasa.gov/mars/mars-relay-network/ . NASA describes light-time from roughly 3 to 22.4 minutes one way, depending on Earth–Mars distance.
- **Mars rover power systems** — https://science.nasa.gov/planetary-science/programs/radioisotope-power-systems/overview/ and https://science.nasa.gov/resource/441839/ . Curiosity and Perseverance use radioisotope power systems; solar panels have been used by other Mars rovers.
- **Space food** — https://www.nasa.gov/missions/artemis/artemis-2/artemis-ii-whats-on-the-menu/ and https://science.nasa.gov/wp-content/uploads/2023/10/Space_Nutrition_Book.pdf . Source for irradiated food and food constraints. The food choice text is a simplified teaching example.
- **Human research / exercise** — https://www.nasa.gov/humans-in-space/counteracting-bone-and-muscle-loss-in-microgravity/ . Background for bone and muscle conditioning in spaceflight.
- **Carbon dioxide** — https://www.nasa.gov/ochmo-tb-004-carbon-dioxide-2/ and https://www.nasa.gov/humans-in-space/wearable-tech-for-space-station-research/ . Background for enclosed cabin CO₂ and ventilation systems.
- **NASA Open Science Data Repository** — https://osdr.nasa.gov/ . Linked as a human-spaceflight research data resource.
- **Real Laika history** — https://www.nasa.gov/history/a-brief-history-of-animals-in-space/ . The game's robot character is a respectful fictional tribute to the dog launched into orbit in 1957.

## Images, fonts, and libraries

- Mars image results link to NASA's public imagery catalog and rover raw-image galleries. Credit: NASA/JPL-Caltech when shown by the image record. See the supplied terrain map notes below for the bundled game assets.
- **Bungee** and **Itim** typefaces — loaded from Google Fonts: https://fonts.google.com/specimen/Bungee and https://fonts.google.com/specimen/Itim . Both are distributed under the SIL Open Font License 1.1.
- No third-party JavaScript libraries. Sound is generated with the browser Web Audio API.

## License notes

The project source code is MIT licensed. NASA media and data retain their source terms and credit requirements; the MIT license does not relicense NASA material.

## Supplied terrain maps
`assets/mission-photos/elevation.png`, `terrain.png`, and `surface-map.png` were supplied by the project owner. They are reference illustrations and are not claimed as live rover photographs. Original dataset, creator and reuse permissions remain to be confirmed by the team before final submission. These files are not covered by the project's MIT code license.
