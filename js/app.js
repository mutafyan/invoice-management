document.addEventListener("DOMContentLoaded", () => {
  const loginPage = document.getElementById("login-page");
  const mainPage = document.getElementById("main-page");
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const usernameDisplay = document.getElementById("username-display");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginError = document.getElementById("login-error");
  const invoicesList = document.getElementById("invoices-list");
  const invoiceLinesList = document.getElementById("invoice-lines-list");
  let loggedInUser = null;
  let products = [];

  const host = "https://..."; // add the host url

  async function fetchData(endpoint) {
    try {
      const response = await fetch(`${host}/${endpoint}`);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      return data.value;
    } catch (error) {
      console.error("Fetch operation error:", error);
    }
  }

  loginButton.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const users = await fetchData("users");

    if (users) {
      const user = users.find(
        (u) => u.Name === username && u.Password === password
      );
      if (user) {
        loggedInUser = user;
        usernameDisplay.textContent = `User: ${user.Name}`;
        loginPage.style.display = "none"; // Hide login page
        mainPage.style.display = "block"; // Show main page
        products = await fetchData("products");
        loadInvoices();
      } else {
        loginError.classList.remove("hidden");
      }
    } else {
      loginError.classList.remove("hidden");
    }
  });

  logoutButton.addEventListener("click", () => {
    loggedInUser = null;
    usernameDisplay.textContent = "";
    loginPage.style.display = "block"; // Show login page
    mainPage.style.display = "none"; // Hide main page
    invoicesList.innerHTML = "";
    invoiceLinesList.innerHTML = "";
  });

  async function loadInvoices() {
    const invoices = await fetchData("invoices");
    if (invoices) {
      const userInvoices = invoices.filter(
        (invoice) => invoice.UserId === loggedInUser.UserId
      );
      userInvoices.forEach(async (invoice) => {
        const lines = await fetchData("invoicelines");
        const invoiceLines = lines.filter(
          (line) => line.InvoiceId === invoice.InvoiceId
        );
        const totalAmount = invoiceLines.reduce((sum, line) => {
          const product = products.find((p) => p.ProductId === line.ProductId);
          return sum + line.Quantity * (product ? product.Price : 0);
        }, 0);

        const row = document.createElement("tr");
        row.innerHTML = `
                    <td><input type="radio" name="invoice" value="${
                      invoice.InvoiceId
                    }"></td>
                    <td>${invoice.Name}</td>
                    <td>${invoice.PaidDate.split("T")[0]}</td>
                    <td>${totalAmount.toFixed(2)}</td>
                `;
        invoicesList.appendChild(row);
      });

      invoicesList.addEventListener("change", async (event) => {
        if (event.target.name === "invoice") {
          const invoiceId = event.target.value;
          const lines = await fetchData("invoicelines");
          const invoiceLines = lines.filter(
            (line) => line.InvoiceId === invoiceId
          );
          invoiceLinesList.innerHTML = "";
          invoiceLines.forEach((line) => {
            const product = products.find(
              (p) => p.ProductId === line.ProductId
            );
            const totalPrice = line.Quantity * (product ? product.Price : 0);
            const row = document.createElement("tr");
            row.innerHTML = `
                            <td>${product ? product.Name : "Unknown"}</td>
                            <td>${
                              product ? product.Price.toFixed(2) : "N/A"
                            }</td>
                            <td>${line.Quantity}</td>
                            <td>${totalPrice.toFixed(2)}</td>
                        `;
            invoiceLinesList.appendChild(row);
          });
        }
      });
    }
  }
});
