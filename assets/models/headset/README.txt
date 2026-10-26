Drop the VR headset 3D model here as:

    headset.glb

Binary GLTF (.glb) — a single file with textures/materials embedded,
so nothing else needs to go in this folder.

The intro scroll sequence (js/intro-scene.js) loads this model, auto-
centers and auto-scales it from its bounding box (so it doesn't matter
what native size/orientation it was exported at), and samples its own
material color to use as the scroll-handoff background color — any
headset color works with no code changes.

Until this file exists, the site silently falls back to the static
gradient hero (no broken scene, no visible error) and logs a console
note naming this exact path.
