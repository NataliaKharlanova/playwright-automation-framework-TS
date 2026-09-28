# Product Overview: SauceDemo + JSONPlaceholder

Reference for writing UI tests against **SauceDemo** (https://www.saucedemo.com) and API tests against **JSONPlaceholder** (https://jsonplaceholder.typicode.com).

**Legend**
- **[V] Verified**: observed on 2026-09-27 by driving the site with Playwright (Chromium, headless) or by calling the API with `curl`.
- **[A] Assumed**: inferred, not directly observed, or likely to change. Confirm it before a test depends on it.

Both are public demo systems owned by third parties (Sauce Labs and Typicode). Data, timings and bugs can change without notice.

---

## 1. SauceDemo (UI)

### 1.1 Features

| Area | What it does | |
|---|---|---|
| Login | Username + password form. The accepted usernames and the shared password are printed on the login page. | [V] |
| Inventory | 6 products with name, description, price, image and an Add to cart / Remove toggle. | [V] |
| Sorting | Dropdown `[data-test=product-sort-container]` with values `az`, `za`, `lohi`, `hilo`. Default is `az`. | [V] |
| Product detail | `/inventory-item.html?id=<n>`, opened by clicking a product name. Has its own Add/Remove button. | [V] |
| Cart | `/cart.html`. Lists items with a quantity (always 1, read-only `<div>`, not editable), plus Continue Shopping and Checkout. | [V] |
| Checkout | Step 1 `/checkout-step-one.html` (first name, last name, postal code) → Step 2 `/checkout-step-two.html` (summary) → `/checkout-complete.html` ("Thank you for your order!"). | [V] |
| Burger menu | All Items, Dynamic Catalog, About, Logout, Reset App State. | [V] |
| Dynamic Catalog / About | Present in the menu. Not explored. About probably links to saucelabs.com. | [A] |
| Footer social links, responsive layout | Not explored. | [A] |

**Product catalog** (standard_user) [V]

| id | Name | Price |
|---|---|---|
| 4 | Sauce Labs Backpack | $29.99 |
| 0 | Sauce Labs Bike Light | $9.99 |
| 1 | Sauce Labs Bolt T-Shirt | $15.99 |
| 5 | Sauce Labs Fleece Jacket | $49.99 |
| 2 | Sauce Labs Onesie | $7.99 |
| 3 | Test.allTheThings() T-Shirt (Red) | $15.99 |

Add/remove buttons have stable test ids derived from the slugified name, for example `[data-test=add-to-cart-sauce-labs-backpack]` and `[data-test=remove-sauce-labs-backpack]`. On the product detail page the ids are plain `add-to-cart` and `remove`. [V]

### 1.2 User flows

1. **Happy-path purchase** [V]: login → add items → cart → Checkout → fill all 3 fields → Continue → review summary → Finish → confirmation page. The cart badge disappears after Finish.
2. **Login validation** [V]. Error messages, all in `[data-test=error]`:
   - empty username: `Epic sadface: Username is required`
   - empty password: `Epic sadface: Password is required`
   - wrong credentials: `Epic sadface: Username and password do not match any user in this service`
   - locked user: `Epic sadface: Sorry, this user has been locked out.`
3. **Checkout validation** [V]. Fields are checked in order, and only the first missing one is reported: `Error: First Name is required`, then `Last Name is required`, then `Postal Code is required`.
4. **Cancel / back navigation** [V]: Cancel on step 1 → cart. Continue Shopping → inventory. Cancel on step 2 was not tested but probably returns to inventory [A].
5. **Logout** [V]: returns to `/`. Using Back or opening a protected URL afterwards shows `Epic sadface: You can only access '/<page>' when you are logged in.`
6. **Reset App State** [V]: clears the cart badge.

### 1.3 Test users and quirks

The password for every user is `secret_sauce`. [V]

| User | Behaviour observed | |
|---|---|---|
| `standard_user` | Everything works. Use it as the baseline. | [V] |
| `locked_out_user` | Login is rejected with the "locked out" error. | [V] |
| `problem_user` | Every product image is the same broken placeholder (`sl-404…jpg`). Sorting silently does nothing. Add to cart works only for Backpack, Bike Light and Onesie (3 of 6). Remove on the inventory page does nothing. Clicking a product name opens the **wrong** product (Bike Light → id=1 Bolt T-Shirt, an off-by-one). On checkout, typing into Last Name overwrites **First Name**, so Last Name stays empty and the user cannot get past step 1. | [V] |
| `performance_glitch_user` | Login took about **5.6 s** (other users took about 0.6 s). Each sort change took more than 3 s. The rest of the flow works. | [V] |
| `error_user` | Sorting shows an alert: "Sorting is broken! This error has been reported to Backtrace." Add to cart fails for 3 of 6 items (JS error "Failed to add item to the cart."). Remove on the inventory page does nothing. Last Name ignores input, yet validation still lets checkout continue. **Finish does nothing**: the page stays on step 2 and the cart is not cleared. | [V] |
| `visual_user` | Inventory prices are **random and change on every re-render** (for example Backpack $45.96, then different values after each sort). Cart and checkout show the real prices, so inventory and cart disagree. The Backpack image is broken. Other visual/layout defects (misaligned elements) are likely but were not checked with screenshots. | [V] / [A] |

The exact failure sets above (which 3 items fail, which fields break) may differ between app releases. [A]

### 1.4 Business rules

| Rule | |
|---|---|
| Tax is 8% of the item total, rounded to cents (99.95 → $8.00, 47.97 → $3.84). | [V] |
| Total = item total + tax. Shipping is always "Free Pony Express Delivery!" and payment is always "SauceCard #31337". | [V] |
| The cart holds one of each product at most. The quantity is fixed at 1. | [V] |
| The cart is stored client-side in `localStorage["cart-contents"]` as an array of product ids (for example `[4]`). It survives page reloads **and logout + login**. | [V] |
| Whether the cart is shared between different users logging in on the same browser (likely, since the storage key has no user scope). | [A] |
| The session is a single cookie, `session-username=<user>`, with a TTL of about **10 minutes** (597 s observed). Protected pages check only that this cookie is present. | [V] |
| All three checkout fields only need to be non-empty. The postal code format is not validated (`!!` is accepted). | [V] |
| Sorting: `lohi`/`hilo` by price and `az`/`za` by name. The two $15.99 items tie, and their order within the tie was not examined. | [V] / [A] |

### 1.5 Known defects in the standard flow (useful as test oracles)

- **Floating-point item total**: with 5 items the step 2 summary shows `Item total: $99.94999999999999`. Tax and Total are formatted correctly. [V]
- **Empty-cart checkout is allowed**: Checkout is enabled with an empty cart, and the order completes with `$0` / `$0.00`. [V]
- **Checkout steps can be skipped**: step 2 opens directly by URL. [V]
- **Reset App State leaves stale buttons**: the badge clears, but buttons already on screen still say "Remove" until the page re-renders. [V]
- **Auth bypass by cookie**: a forged `session-username=standard_user` cookie, without any login, gives full access to `/inventory.html`. [V]
- **Unknown product id**: `?id=99` renders "ITEM NOT FOUND" with price `$√-1` instead of an error page. [V]
- Console always logs a few 401/404 resource errors from telemetry (Backtrace) on normal pages. These are noise, not app failures. [V] (the telemetry cause is [A])

---

## 2. JSONPlaceholder (API)

A fake REST API built on **json-server** (confirmed by a leaked stack trace, see below). No authentication. [V]

### 2.1 Resources

| Resource | Count | Fields | |
|---|---|---|---|
| `/posts` | 100 | `userId, id, title, body` | [V] |
| `/comments` | 500 | `postId, id, name, email, body` | [V] |
| `/albums` | 100 | `userId, id, title` | [V] |
| `/photos` | 5000 | `albumId, id, title, url, thumbnailUrl` | [V] |
| `/todos` | 200 | `userId, id, title, completed` (90 completed) | [V] |
| `/users` | 10 | `id, name, username, email, address{street,suite,city,zipcode,geo{lat,lng}}, phone, website, company{name,catchPhrase,bs}` | [V] |

Relations [V]: user → posts / albums / todos; post → comments; album → photos. Each post has exactly 5 comments and each user has 10 posts. Photos per album is assumed to be 50 (5000 / 100). [A]

### 2.2 Endpoints and query features

| Request | Behaviour | |
|---|---|---|
| `GET /<resource>` | Full list, 200. | [V] |
| `GET /<resource>/:id` | 200 with the object. An unknown id (`/posts/0`, `/posts/abc`, `/users/11`) returns **404 with `{}`**. | [V] |
| `GET /posts/1/comments`, `GET /users/1/posts` | Nested routes. Same result as filtering. | [V] |
| `GET /comments?postId=1` | Filter by any field. No match returns `200 []` (not 404). | [V] |
| `?_page=2&_limit=3` | Pagination. The response has an `X-Total-Count: 100` header and a `Link` header (first/prev/next/last). | [V] |
| `?_sort=id&_order=desc` | Sorting. | [V] |
| `?title_like=qui` | Regex/substring filter. | [V] |
| `?_embed=comments`, `?_expand=user` | Include child records / parent record. | [V] |
| `_start/_end`, `_gte/_lte`, `_ne`, `q=` (full-text) | Standard json-server operators. Not tested. | [A] |
| `POST /posts` | **201**. Echoes the body and adds `id: 101`. The id is always 101, even for repeated calls. | [V] |
| `PUT /posts/1` | 200. Returns **only** the sent fields plus `id` (a full replacement, so other fields disappear). | [V] |
| `PATCH /posts/1` | 200. Returns the merged object. | [V] |
| `DELETE /posts/1` | 200 `{}`. | [V] |
| Unknown route (`/unknown`) | 404. | [V] |

### 2.3 Business rules / API contract

- **Writes are faked**: POST/PUT/PATCH/DELETE return success, but nothing persists. After them, `GET /posts/1` is unchanged and `GET /posts/101` is 404. Tests cannot chain create → read. [V]
- **No input validation**: `POST {}` and a form-encoded body both return 201. [V]
- **No auth**: every endpoint is public. [V]
- `DELETE` on a non-existent id still returns 200. [V]
- Responses are cached by a CDN (`cache-control: max-age=43200`, `cf-cache-status: HIT`). [V]
- Rate limit headers are present: `x-ratelimit-limit: 1000` per window. The window length is not documented. [V] / [A]
- CORS is open to any origin. [A] (only `access-control-expose-headers` was observed)

### 2.4 Known defects

- **`PUT` on a missing id returns 500** and leaks a Node/json-server stack trace (`TypeError: Cannot read properties of undefined (reading 'id')`). [V]
- Ids are numeric, but a non-numeric id returns 404 rather than 400. [V]

---

## 3. Testing risks

| Risk | Impact | Mitigation |
|---|---|---|
| Both systems are third-party and public. | Outages, rate limits and silent behaviour changes cause flaky or red runs that are not our fault. | Keep a health-check/smoke test, retry network-level failures only, and pin expectations to documented behaviour. |
| SauceDemo quirks are intentional and change by user. | A test that "passes" for `standard_user` means nothing for the quirky users, and vice versa. | Parameterise by user and assert the **expected** quirk (for example, expect `error_user` Finish to fail). |
| `performance_glitch_user` is slow. | Default timeouts (5 s for actions, 30 s for tests) may be exceeded. | Use per-test timeouts and web-first assertions. Never use fixed sleeps. |
| `visual_user` prices are random. | Hard-coded price assertions on the inventory page will flake. | Assert against cart/checkout prices, or use visual comparison with masking. |
| Cart state lives in `localStorage` and survives logout. | State leaks between tests that share a browser context or storage state. | Use a fresh context per test (the Playwright default), or clear `cart-contents` / use Reset App State in setup. |
| Session cookie TTL is about 10 minutes. | A reused `storageState` becomes stale in long suites. | Log in per worker/test, or set the cookie programmatically (the forged-cookie behaviour makes this cheap, but it bypasses the real login). |
| The float total bug and `$√-1` rendering. | Tests that parse money from the UI may break. | Parse and round to cents before comparing, and add explicit tests for these defects. |
| JSONPlaceholder writes don't persist. | CRUD "round-trip" tests are impossible and would give false passes if written naively. | Assert only the response of the write itself. For stateful CRUD, use a local json-server. |
| POST always returns id 101. | Uniqueness checks on created ids fail. | Don't assert uniqueness. |
| CDN caching on JSONPlaceholder. | Responses may not reflect changes immediately (the data is static anyway). | Low risk. Note it for debugging. |
| Rate limiting (1000 requests per window). | High parallelism or `--repeat-each` runs may get throttled. | Cap workers for API projects. |
| The existing framework targets Toolshop (`.env` sets `BASE_URL`/`API_URL`). | Adding these SUTs needs separate env config and Playwright projects. | Add dedicated env variables/projects. Do not repurpose the Toolshop ones. [A] |
