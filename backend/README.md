# Gemini inventory extraction

Set `GEMINI_API_KEY` in `.env` to enable extraction. `GEMINI_MODEL` is optional
and defaults to `gemini-3.1-flash-lite`. Set it to another supported Gemini
model to override the default. The key is read only by the backend.

Start the app with `npm run dev`, then open
`http://localhost:3000/pages/scan-inventory.html`.

`POST /api/ai/extract` accepts a single multipart image in the `image` field
(JPEG, PNG, or WebP; maximum 8 MB). It returns extracted product candidates,
categories, confidence estimates, and review flags. Low-confidence or incomplete
fields are marked for user review. This endpoint does not save inventory.
Confidence is a rough model estimate rather than a calibrated probability; every
extracted field must be checked against the source sheet. The backend checks the
uploaded file signature as well as its declared image type.

The review page can also submit manually verified candidates to
`POST /api/ai/verify`. It requires product names, whole-number quantities, and
unit prices. Existing products are matched by name and restocked additively;
new products are added to the inventory. No extracted data is saved before the
user explicitly submits the verified results.

Run the unit and endpoint tests with `node --test`.
