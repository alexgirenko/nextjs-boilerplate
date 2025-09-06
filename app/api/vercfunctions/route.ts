import { NextRequest, NextResponse } from "next/server";
import puppeteerCore from "puppeteer-core";
// Ensure Node.js runtime on Vercel and allow longer execution time
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 70; // seconds

async function getBrowser() {
  const isVercel = !!process.env.VERCEL_ENV;

  if (isVercel) {
    console.log("Running on Vercel, trying fixed chromium approach...");

    // Try the regular chromium with a different approach
    const chromium = (await import("@sparticuz/chromium")).default;

    // Set environment variables for better chromium handling
    process.env.FONTCONFIG_PATH = "/tmp";
    process.env.HOME = "/tmp";

    // Use a custom executable path that might work better
    const customArgs = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-extension",
      "--disable-ipc-flooding-protection",
      "--single-process",
      "--disable-crash-reporter",
      "--disable-component-extensions-with-background-pages",
      "--disable-default-apps",
      "--mute-audio",
      "--no-default-browser-check",
      "--no-pings",
      "--disable-hang-monitor",
      "--disable-prompt-on-repost",
      "--disable-sync",
      "--user-data-dir=/tmp/chrome-user-data",
      "--data-path=/tmp/chrome-data",
      "--disk-cache-dir=/tmp/chrome-cache",
      "--remote-debugging-port=9222",
      "--remote-debugging-address=0.0.0.0",
    ];

    // Try to use chromium's executable path, but with error handling
    let executablePath: string;
    try {
      executablePath = await chromium.executablePath();
      console.log("✅ Using chromium.executablePath():", executablePath);
    } catch (error) {
      // Fallback: try to find chromium in common locations
      console.log("❌ chromium.executablePath() failed, trying fallback...");
      const possiblePaths = [
        "/usr/bin/chromium-browser",
        "/usr/bin/chromium",
        "/usr/bin/google-chrome",
        "/opt/google/chrome/chrome",
        "/snap/bin/chromium",
      ];

      const fs = await import("fs");
      executablePath =
        possiblePaths.find((path) => {
          try {
            return fs.existsSync(path);
          } catch {
            return false;
          }
        }) || "/usr/bin/chromium-browser"; // Default fallback

      console.log("Using fallback executable path:", executablePath);
    }

    return await puppeteerCore.launch({
      headless: true,
      args: customArgs,
      executablePath: executablePath,
      ignoreDefaultArgs: ["--disable-extensions"],
      timeout: 30000,
    });
  } else {
    console.log("Running locally, using full puppeteer...");
    const puppeteer = await import("puppeteer");
    return await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });
  }
}


const SITE_URL = "https://app.incomeconductor.com";

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Wait for a specified amount of time
 * @param {number} ms - Milliseconds to wait
 */
const wait = (msec: number) => new Promise((resolve) => setTimeout(resolve, msec));

/**
 * Main automation function that handles the complete Income Conductor workflow
 * @param {Object} formData - Form data from the frontend
 * @returns {Object} Automation result with extracted data
 */
async function runAutomation(formData: any) {
  let browser: any;
  let monthlyIncomeGross = null;
  let extractedValues = {
    monthlyIncomeGross: null,
    plans: [],
    investmentsByYears: [],
  };

  try {
    // ========================================
    // BROWSER INITIALIZATION (Vercel-compatible)
    // ========================================
    console.log("Launching browser...");
    browser = await getBrowser();
    console.log("Opening new page...");
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1366, height: 768 });

    // Navigate to the Income Conductor app
    console.log("Navigating to Income Conductor...");
    await page.goto(SITE_URL, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    console.log("Page loaded successfully!");

    // Wait for page to fully load
    await wait(300);

    // ========================================
    // AUTHENTICATION PROCESS
    // ========================================

    try {
      // Look for common login field selectors
      const loginSelectors = [
        'input[type="email"]',
        'input[name="email"]',
        'input[name="username"]',
        'input[placeholder*="email" i]',
        'input[placeholder*="username" i]',
        "#email",
        "#username",
      ];

      let emailInput = null;
      for (const selector of loginSelectors) {
        try {
          emailInput = await page.waitForSelector(selector, { timeout: 300 });
          if (emailInput) {
            console.log(`Found email input with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (emailInput) {
        console.log("Login form detected, proceeding with login...");

        // Clear and type email
        await emailInput.click({ clickCount: 3 });
        await emailInput.type(formData.username);
        console.log("Email entered");

        // Find password field
        const passwordSelectors = [
          'input[type="password"]',
          'input[name="password"]',
          "#password",
        ];

        let passwordInput = null;
        for (const selector of passwordSelectors) {
          try {
            passwordInput = await page.$(selector);
            if (passwordInput) {
              console.log(`Found password input with selector: ${selector}`);
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }

        if (passwordInput) {
          await passwordInput.click({ clickCount: 3 });
          await passwordInput.type(formData.password);
          console.log("Password entered");

          // Find and click login button
          const loginButtonSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:contains("Login")',
            'button:contains("Sign In")',
            ".login-button",
            "#login-button",
          ];

          let loginButton = null;
          for (const selector of loginButtonSelectors) {
            try {
              loginButton = await page.$(selector);
              if (loginButton) {
                console.log(`Found login button with selector: ${selector}`);
                break;
              }
            } catch (e) {
              // Continue to next selector
            }
          }

          if (loginButton) {
            console.log("Clicking login button...");
            await loginButton.click();

            // Wait for navigation after login
            await wait(1000);
            console.log("Login submitted, waiting for page to load...");

            // Wait for potential redirect or loading
          } else {
            console.log("Login button not found, trying to submit form");
            await page.keyboard.press("Enter");
            await wait(1000);
          }
        } else {
          throw new Error("Password field not found");
        }
      } else {
        console.log(
          "No login form detected, user might already be logged in or page structure is different"
        );
      }
    } catch (loginError: any) {
      console.log(
        "Login attempt completed with some issues:",
        loginError.message
      );
    }

    // ========================================
    // NAVIGATION & PLAN SELECTION
    // ========================================
    await wait(500);

    try {
      console.log("Looking for Plan card...");

      // Simple selector for the Plan card title
      const planCardSelector = "h5.card-title";
      await page.waitForSelector(planCardSelector, { timeout: 500 });

      // Click on the Plan card by finding the h5 with "Plan" text
      await page.evaluate(() => {
        const planTitles = document.querySelectorAll("h5.card-title");
        for (let title of planTitles) {
          if (title.textContent?.trim() === "Plan") {
            (title as HTMLElement).click();
            return;
          }
        }
      });

      await wait(1000);
      console.log("Plan card clicked successfully");
    } catch (error: any) {
      console.log("Could not click Plan card:", error.message);
    }

    // ========================================
    // CLIENT SELECTION & INTERACTION
    // ========================================

    try {
      console.log("Looking for Average, Joe client link...");

      // Click on the client link containing "Average, Joe"
      await page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="/clients/view/"]');
        if (links[1]) {
          (links[1] as HTMLElement).click(); // TODO should the user number be a parameter of function?
        }
      });

      await wait(500);
      console.log("Client link clicked successfully");
    } catch (error: any) {
      console.log("Could not click client link:", error.message);
    }

    // Wait and click on Profile link
    await wait(500);

    try {
      console.log("Looking for Profile link...");

      // Click on the Profile nav link
      await page.evaluate(() => {
        const links = document.querySelectorAll("a.nav-link");
        for (let link of links) {
          if (link.textContent?.trim() === "Profile") {
            (link as HTMLElement).click();
            return;
          }
        }
      });

      await wait(500);
      console.log("Profile link clicked successfully");
    } catch (error: any) {
      console.log("Could not click Profile link:", error.message);
    }

    // ========================================
    // PROFILE UPDATES
    // ========================================
    await wait(500);

    try {
      const birthday = formData.birthday || "07/01/1967";
      console.log("Looking for date of birth field...");

      // Find and fill the DOB input field
      const dobInput = await page.$("#data\\.dob");
      if (dobInput) {
        // Clear existing value and type new date
        await dobInput.click({ clickCount: 3 });
        await dobInput.type(birthday);
        console.log(`Date of birth field filled successfully with ${birthday}`);
      } else {
        console.log("Date of birth field not found");
      }

      await wait(100);
    } catch (error: any) {
      console.log("Could not fill date of birth field:", error.message);
    }

    // Wait and click Save changes button
    await wait(100);

    try {
      console.log("Looking for Save changes button...");

      // Click on the Save changes button
      await page.evaluate(() => {
        const spans = document.querySelectorAll("span");
        for (let span of spans) {
          if (span.textContent?.trim() === "Save changes") {
            // Click the span or its parent button
            const button = span.closest("button") || span;
            (button as HTMLElement).click();
            return;
          }
        }
      });

      await wait(500);
      console.log("Save changes button clicked successfully");
    } catch (error: any) {
      console.log("Could not click Save changes button:", error.message);
    }

    // Wait and click on Plans link
    await wait(500);

    try {
      console.log("Looking for Plans link...");

      // Click on the Plans nav link
      await page.evaluate(() => {
        const links = document.querySelectorAll("a.nav-link");
        for (let link of links) {
          if (link.textContent?.trim() === "Plans") {
            (link as HTMLElement).click();
            return;
          }
        }
      });

      await wait(500);
      console.log("Plans link clicked successfully");
    } catch (error: any) {
      console.log("Could not click Plans link:", error.message);
    }

    // Wait and click on chevron-down icon
    await wait(700);

    try {
      console.log("Looking for chevron-down icon...");

      // Click on the chevron-down icon
      await page.evaluate(() => {
        const chevronIcons = document.querySelectorAll("i.fa-chevron-down");
        if (chevronIcons.length > 0) {
          (chevronIcons[0] as HTMLElement).click();
          return;
        }
      });

      await wait(300);
      console.log("Chevron-down icon clicked successfully");
    } catch (error: any) {
      console.log("Could not click chevron-down icon:", error.message);
    }

    // Wait and click on Edit dropdown item
    await wait(500);

    try {
      console.log("Looking for Edit dropdown item...");

      // Click on the Edit dropdown item
      await page.evaluate(() => {
        const dropdownItems = document.querySelectorAll("a.dropdown-item");
        for (let item of dropdownItems) {
          if (item.textContent?.trim() === "Edit") {
            (item as HTMLElement).click();
            return;
          }
        }
      });

      await wait(500);
      console.log("Edit dropdown item clicked successfully");
    } catch (error: any) {
      console.log("Could not click Edit dropdown item:", error.message);
    }

    // Wait and handle SweetAlert2 OK button with multiple strategies
    await wait(1000);

    try {
      console.log("Looking for SweetAlert2 OK button...");

      // Multiple selectors to try for SweetAlert2 OK button
      const okButtonSelectors = [
        "button.swal2-confirm.btn.btn-info",
        "button.swal2-confirm",
        ".swal2-confirm",
        'button[class*="swal2-confirm"]',
        ".swal2-popup button.btn-info",
        '.swal2-popup button:contains("OK")',
        ".swal2-actions button",
        "button.btn.btn-info",
      ];

      let okButton = null;
      let foundSelector = null;

      // Try each selector with a wait
      for (const selector of okButtonSelectors) {
        try {
          console.log(`Trying selector: ${selector}`);
          okButton = await page.waitForSelector(selector, { timeout: 1000 });
          if (okButton) {
            foundSelector = selector;
            console.log(`Found OK button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
          console.log(`Selector ${selector} not found, trying next...`);
        }
      }

      // If no specific selector worked, try a more general approach
      if (!okButton) {
        console.log("Trying general approach to find OK button...");
        okButton = await page.evaluate(() => {
          // Look for any button containing "OK" text
          const buttons = document.querySelectorAll("button");
          for (let button of buttons) {
            if (
              button.textContent &&
              button.textContent.trim().toLowerCase().includes("ok")
            ) {
              return button;
            }
          }

          // Look for SweetAlert2 confirm buttons
          const swalButtons = document.querySelectorAll(
            '[class*="swal2"], [class*="confirm"]'
          );
          for (let button of swalButtons) {
            if (button.tagName === "BUTTON") {
              return button;
            }
          }

          return null;
        });

        if (okButton) {
          foundSelector = "general text/class search";
        }
      }

      if (okButton) {
        await okButton.click();
        console.log(
          `SweetAlert2 OK button clicked successfully using: ${foundSelector}`
        );
      } else {
        console.log(
          "SweetAlert2 OK button not found with any method - continuing without clicking"
        );
      }

      await wait(500);
    } catch (error: any) {
      console.log("Could not click SweetAlert2 OK button:", error.message);
      console.log("Continuing automation without OK button click...");
    }

    // Wait and click Done button with multiple strategies
    await wait(500);

    try {
      console.log("Looking for Done button...");

      // Multiple selectors to try for Done button
      const doneButtonSelectors = [
        "button.wt-btn-next",
        'button[class*="wt-btn-next"]',
        'button:contains("Done")',
        'button[class*="next"]',
        ".wt-btn-next",
        "button.btn-next",
      ];

      let doneButton = null;
      let foundSelector = null;

      // Try each selector
      for (const selector of doneButtonSelectors) {
        try {
          doneButton = await page.waitForSelector(selector, { timeout: 1000 });
          if (doneButton) {
            foundSelector = selector;
            console.log(`Found Done button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // If no specific selector worked, try a general approach
      if (!doneButton) {
        doneButton = await page.evaluate(() => {
          const buttons = document.querySelectorAll("button");
          for (let button of buttons) {
            if (
              button.textContent &&
              button.textContent.trim().toLowerCase().includes("done")
            ) {
              return button;
            }
          }
          return null;
        });
        if (doneButton) {
          foundSelector = 'text search for "done"';
        }
      }

      if (doneButton) {
        await doneButton.click();
        console.log(`Done button clicked successfully using: ${foundSelector}`);
      } else {
        console.log(
          "Done button not found with any method - continuing without clicking"
        );
      }

      await wait(500);
    } catch (error: any) {
      console.log("Could not click Done button:", error.message);
      console.log("Continuing automation without Done button click...");
    }

    // ========================================
    // INVESTMENT CONFIGURATION
    // ========================================
    await wait(500);

    try {
      const investmentAmount = formData.investmentAmount || "130000";
      console.log("Looking for investment amount field...");

      // Find and fill the investment amount input field
      const investmentInput = await page.$('input[name="investmentamount"]');
      if (investmentInput) {
        // Clear existing value and type new amount
        await investmentInput.click({ clickCount: 3 });
        await investmentInput.type(investmentAmount);
        await page.keyboard.press("Enter");
        console.log(
          `Investment amount field filled successfully with ${investmentAmount} and Enter pressed`
        );
      } else {
        console.log("Investment amount field not found");
      }

      await wait(500);
    } catch (error: any) {
      console.log("Could not fill investment amount field:", error.message);
    }

    // Wait and click Clients tab
    await wait(500);

    try {
      console.log("Looking for Clients tab...");

      // Click on the Clients tab
      const clientsTab = await page.$('a.nav-link[data-tabid="8"]');
      if (clientsTab) {
        await clientsTab.click();
        console.log("Clients tab clicked successfully");
      } else {
        console.log("Clients tab not found");
      }

      await wait(500);
    } catch (error: any) {
      console.log("Could not click Clients tab:", error.message);
    }

    // Wait and fill client fields
    await wait(500);

    try {
      const retirementAge = formData.retirementAge || "62";
      const longevityEstimate = formData.longevityEstimate || "100";
      console.log("Looking for client retirement age field...");

      // Fill retirement age field
      const retirementAgeInput = await page.$(
        'input[name="client_retirement_age"]'
      );
      if (retirementAgeInput) {
        await retirementAgeInput.click({ clickCount: 3 });
        await retirementAgeInput.type(retirementAge);
        console.log(
          `Retirement age field filled successfully with ${retirementAge}`
        );
      } else {
        console.log("Retirement age field not found");
      }

      await wait(100);

      // Fill longevity field
      const longevityInput = await page.$('input[name="client_longevity"]');
      if (longevityInput) {
        // a lot of tricky commands to fill in one cell
        // (because of usual method did not work, for example I used 93, but it was all the time reset to 90.)
        await longevityInput.focus();
        await page.keyboard.down("Control");
        await page.keyboard.press("A");
        await page.keyboard.up("Control");
        await page.keyboard.press("Backspace");
        await longevityInput.click({ clickCount: 3 }); //  it was this single line here, but it did not work
        await longevityInput.type(longevityEstimate);
        await page.keyboard.press("Enter");
        console.log(
          `Longevity field filled successfully with ${longevityEstimate}`
        );
      } else {
        console.log("Longevity field not found");
      }

      await wait(100);

      // Select retirement month
      const retirementMonth = formData.retirementMonth || "1";
      console.log(`🗓️ Retirement Month/Year data received:`, {
        retirementMonth: formData.retirementMonth,
        retirementYear: formData.retirementYear,
        allFormData: formData,
      });
      console.log(`Selecting retirement month: ${retirementMonth}`);

      try {
        const monthSelect = await page.$(
          'select[name="client_retirement_month"]'
        );
        if (monthSelect) {
          await page.select(
            'select[name="client_retirement_month"]',
            retirementMonth
          );
          console.log(
            `Retirement month selected successfully: ${retirementMonth}`
          );
        } else {
          console.log("Retirement month select not found");
        }
      } catch (error: any) {
        console.log("Could not select retirement month:", error.message);
      }

      await wait(100);

      // Select retirement year
      const retirementYear = formData.retirementYear || "2030";
      console.log(`Selecting retirement year: ${retirementYear}`);

      try {
        const yearSelect = await page.$(
          'select[name="client_retirement_year"]'
        );
        if (yearSelect) {
          await page.select(
            'select[name="client_retirement_year"]',
            retirementYear
          );
          console.log(
            `Retirement year selected successfully: ${retirementYear}`
          );
        } else {
          console.log("Retirement year select not found");
        }
      } catch (error: any) {
        console.log("Could not select retirement year:", error.message);
      }

      await wait(500);
    } catch (error: any) {
      console.log("Could not fill client fields:", error.message);
    }

    // Wait and click Update button with multiple strategies
    await wait(500);

    try {
      console.log("Looking for Update button...");

      // Multiple selectors to try for Update button
      const updateButtonSelectors = [
        "button.btn.btn-primary",
        "button.btn-primary",
        'button[class*="btn-primary"]',
        'button:contains("Update")',
        'button[type="submit"]',
        'input[type="submit"]',
        ".btn-primary",
      ];

      let updateButton = null;
      let foundSelector = null;

      // Try each selector
      for (const selector of updateButtonSelectors) {
        try {
          updateButton = await page.waitForSelector(selector, {
            timeout: 500,
          });
          if (updateButton) {
            foundSelector = selector;
            console.log(`Found Update button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // If no specific selector worked, try a general approach
      if (!updateButton) {
        updateButton = await page.evaluate(() => {
          const buttons = document.querySelectorAll(
            'button, input[type="submit"]'
          );
          for (let button of buttons) {
            if (
              button.textContent &&
              button.textContent.trim().toLowerCase().includes("update")
            ) {
              return button;
            }
            if (
              (button as HTMLInputElement).value &&
              (button as HTMLInputElement).value
                .toLowerCase()
                .includes("update")
            ) {
              return button;
            }
          }
          return null;
        });
        if (updateButton) {
          foundSelector = 'text search for "update"';
        }
      }

      if (updateButton) {
        await updateButton.click();
        console.log(
          `Update button clicked successfully using: ${foundSelector}`
        );
      } else {
        console.log(
          "Update button not found with any method - continuing without clicking"
        );
      }

      await wait(700);
    } catch (error: any) {
      console.log("Could not click Update button:", error.message);
      console.log("Continuing automation without Update button click...");
    }

    // ========================================
    // DATA EXTRACTION & RESULTS
    // ========================================
    await wait(1000);

    try {
      console.log("Extracting Income /mo (Gross) value...");

      // Extract Income /mo (Net) value from plan summary
      monthlyIncomeGross = await page.evaluate(() => {
        const listItems = document.querySelectorAll(
          ".list-plan-summary .list-group-item"
        );
        for (let item of listItems) {
          const label = item.querySelector("span");
          if (label && label.textContent?.trim() === "Income /mo (Gross)") {
            const badge = item.querySelector(".badge");
            if (badge) {
              return badge.textContent?.trim();
            }
          }
        }
        return null;
      });

      if (monthlyIncomeGross) {
        console.log("=== MONTHLY INCOME (Gross) EXTRACTED ===");
        console.log(`Income /mo (Gross): ${monthlyIncomeGross}`);
        console.log("========================================");
      } else {
        console.log("Income /mo (Gross) value not found in plan summary");
      }
    } catch (error: any) {
      console.log("Could not extract Income /mo (Gross) value:", error.message);
    }

    // Extract Start of Plan values - specifically $40,567 and $109,433
    try {
      console.log("Extracting Start of Plan values...");
      let startOfPlanValues = await page.evaluate(() => {
        const rows = document.querySelectorAll("tr");
        for (let row of rows) {
          const firstCell = row.querySelector("td");
          if (firstCell && firstCell.textContent?.trim() === "Start of Plan") {
            const rightAlignedCells = row.querySelectorAll("td.text-right");
            if (rightAlignedCells.length > 1) {
              // Collect all values except the last one into an array
              const plans = [];
              for (let i = 0; i < rightAlignedCells.length - 1; i++) {
                plans.push(rightAlignedCells[i].textContent?.trim());
              }
              return {
                plans: plans,
              };
            }
          }
        }
        return null;
      });

      console.log("Extracting investment by years");
      let investmentsByYears = await page.evaluate(() => {
        const rows = document.querySelectorAll("tr");
        const investments = [];
        for (let i = 2; i < rows.length; i++) {
          // skip the first row
          const cells = rows[i].querySelectorAll("td");
          if (cells.length >= 3) {
            investments.push({
              year: cells[0].textContent?.trim(),
              investment: cells[2].textContent?.trim(),
            });
          }
        }
        return { investments };
      });

      console.log("Start of Plan values extraction completed");
      console.log(startOfPlanValues);
      if (startOfPlanValues) {
        console.log("=== START OF PLAN VALUES EXTRACTED ===");
        console.log(`Target Values: ${startOfPlanValues.plans}`);

        extractedValues = {
          monthlyIncomeGross: monthlyIncomeGross,
          plans: startOfPlanValues.plans ? startOfPlanValues.plans : [],
          investmentsByYears: investmentsByYears
            ? investmentsByYears.investments
            : [],
        };
      } else {
        console.log("Start of Plan values not found");
      }
      console.log("========================================");
      console.log("Extracted Values:", JSON.stringify(extractedValues));
    } catch (error: any) {
      console.log("Could not extract Start of Plan values:", error.message);
    }

    return extractedValues;
  } catch (error: any) {
    console.error("Automation failed:", error);
    throw new Error(`Automation failed: ${error.message}`);
  } finally {
    // Close the browser if it was opened
    if (browser) {
      await browser.close();
      console.log("Browser closed");
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const formData = body?.formData;
    if (!formData || typeof formData !== "object") {
      return NextResponse.json(
        { error: "formData object is required." },
        { status: 400 }
      );
    }

    // List of required properties
    const requiredProps = [
      "birthday",
      "investmentAmount",
      "retirementAge",
      "longevityEstimate",
      "retirementMonth",
      "retirementYear",
      "username",
      "password",
    ];

    for (const prop of requiredProps) {
      if (!(prop in formData)) {
        return NextResponse.json(
          { error: `Missing property: ${prop}` },
          { status: 400 }
        );
      }
      if (typeof formData[prop] !== "string") {
        return NextResponse.json(
          { error: `Property '${prop}' must be a string.` },
          { status: 400 }
        );
      }
    }

    // Run the automation with the provided formData
    console.log("Starting automation process...");
    const result = await runAutomation(formData);

    console.log("Automation completed successfully");
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Automation error:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON format." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: `Automation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
