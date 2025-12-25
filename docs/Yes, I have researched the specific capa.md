Yes, I have researched the specific capabilities of the **Gemini 3 Pro Image Preview** (and the related Gemini 2.5 Flash Image) models.

The capability you are referring to is officially called **Conversational Image Editing** (sometimes referred to internally by developers as "Nano Banana" technology). It allows the model to "see" your image and apply **local edits** (inpainting) without you needing to manually draw masks or use complex software.

Here is the deep dive on how to prompt this model to add props while keeping the image consistent.

### The Core Concept: "Anchor & Add" Prompting
The secret to this model is that it treats image generation as a **conversation**, not a one-off task. To add a prop without hallucinating a whole new image, you must use an **"Anchor & Add"** prompting strategy. You need to explicitly tell the model what to *keep* (Anchor) and what to *change* (Add).

### Step-by-Step Workflow

**Prerequisite:** You must be using a model version that supports **Image Editing** (like `gemini-3-pro-image-preview` or `gemini-2.5-flash-image`) via Google AI Studio or Vertex AI.

#### 1. The Setup
*   **Upload** your base image to the chat/prompt window.
*   **Do not** simply say "Add a hat." (This often causes the model to regenerate a *similar* image but with different details).

#### 2. The Golden Prompt Template
Use this structure to force the model to edit the existing pixels rather than generate new ones:

> **"Using the provided image, [ACTION] a [NEW PROP] [LOCATION]. Maintain the [ANCHOR ELEMENTS] exactly as they are. Match the lighting, style, and perspective of the original photo."**

### Specific Prompting Scenarios

Here are the specific prompts to achieve the "consistent image + new prop" effect:

#### Scenario A: Adding a Handheld Prop (e.g., a coffee cup)
*   **Bad Prompt:** "Give her a coffee cup."
*   **Good Prompt:**
    > "Edit this image to place a white ceramic coffee cup in the woman's right hand. Keep her facial expression, hair, and clothing exactly the same. The cup should cast a shadow on her hand consistent with the scene's lighting."

#### Scenario B: Adding a Background Prop (e.g., a lamp)
*   **Good Prompt:**
    > "Add a vintage floor lamp to the back left corner of the room. Do not change the furniture or the rug. The lamp should be off, simply serving as a prop. Ensure the perspective matches the camera angle of the original room."

#### Scenario C: Changing an Outfit Element (e.g., adding a hat/scarf)
*   **Good Prompt:**
    > "Using the uploaded image, add a red wool scarf around the character's neck. Ensure the scarf drapes naturally over the existing jacket. Do not alter the character's face or the background scenery."

### Critical "Power Words" for Consistency
To make this work flawlessly, include these keywords in your prompt:

1.  **"Inpainting" / "Local Edit":** While not always strictly necessary in natural language, using these terms helps the model understand the *task type*.
    *   *Example:* "Perform a local edit to add a wristwatch..."
2.  **"Seamless Blend":** Tells the model to feather the edges of the new object so it doesn't look pasted on.
3.  **"Reference":** If you have a specific look for the prop, you can sometimes describe it in extreme detail or (in some interfaces) provide a reference image for the prop itself, though text description is usually safer for keeping the *original* image consistent.

### Troubleshooting: "It changed the face!"
If the model regenerates the face or background when you only asked for a prop, you need to increase the **strictness** of your anchor.

*   **The "Masking" Prompt:** Even though you aren't drawing a mask, you can describe one verbally.
    > "Change **only** the area on the table surface. **Leave the rest of the image 100% pixel-perfect identical.** Place a vase of flowers on the table."

### Summary Checklist for Success
1.  **Upload the Base Image** first.
2.  Start your prompt with **"Edit this image..."** or **"Using the provided image..."**
3.  Describe the **Location** of the new prop precisely (e.g., "in the bottom left corner," "on the table").
4.  Add the constraint: **"Keep the rest of the image unchanged."**
5.  Add the style constraint: **"Match the lighting and grain of the original."**