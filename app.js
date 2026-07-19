/* -------------------------------------------------------------
 * CraftyHand JavaScript Application Logic
 * Implements LocalStorage state, Dynamic Store rendering, 
 * checkout builders, and a password-protected admin portal.
 * ------------------------------------------------------------- */

// --- Default Sample Data ---
const DEFAULT_PRODUCTS = [
  {
    id: "prod-macrame",
    title: "Boho Macramé Wall Hanging",
    category: "Textiles",
    price: 45.00,
    description: "Intricately hand-woven bohemian wall hanging made from 100% natural, premium cotton cords. Mounted on a hand-sanded rustic drift birch branch. Perfect for adding a warm, textured artistic touch to your bedroom, living space, or nursery. Dimensions: 24\" wide x 32\" long.",
    image: "images/macrame_wall_hanging.jpg",
    badge: "Best Seller",
    whatsapp: ""
  },
  {
    id: "prod-mug",
    title: "Rustic Ceramic Speckled Mug",
    category: "Ceramics",
    price: 24.00,
    description: "Individually hand-thrown on the potter's wheel, this stoneware coffee mug features a rustic sandy clay body finished with a speckled cream and celadon glaze. Food, microwave, and dishwasher safe. Holds approximately 14 oz of your favorite warm beverage. Each mug features minor unique variations, highlighting its artisan nature.",
    image: "images/ceramic_mug.jpg",
    badge: "100% Organic",
    whatsapp: ""
  },
  {
    id: "prod-box",
    title: "Hand-carved Wooden Jewelry Box",
    category: "Woodwork",
    price: 79.00,
    description: "An exquisite jewelry box masterfully carved by hand from sustainably sourced premium walnut wood. Features intricate floral relief motifs on the lid and side panels, a velvet-lined interior with ring dividers, and a sturdy vintage brass latch clasp. Finished with natural oils to highlight the rich wood grain. Dimensions: 8\" x 5.5\" x 4.5\".",
    image: "images/wooden_jewelry_box.jpg",
    badge: "Limited Edition",
    whatsapp: ""
  },
  {
    id: "prod-candle",
    title: "Soy Botanical Scented Candle",
    category: "Candles",
    price: 18.50,
    description: "Hand-poured in small batches, this eco-friendly organic soy wax candle is infused with premium oakmoss and amber essential oils. Features a crackling natural wooden wick and is housed in a clean amber glass jar that casts a warm golden glow. Burns cleanly for 45-50 hours. Free of paraffin, phthalates, and synthetic dyes.",
    image: "images/organic_soy_candle.jpg",
    badge: "New Arrival",
    whatsapp: ""
  }
];

const DEFAULT_SETTINGS = {
  shopName: "CraftyHand",
  shopTagline: "Beautiful Handcrafted Creations - Made with Love",
  whatsappNumber: "919876543210", // Example format: Country code (91) + phone number
  adminPasscode: "crafts"
};

// Set to "/check-location" for local server, or your Google Apps Script URL for cloud deployment
const BACKEND_API_URL = "https://script.google.com/macros/s/AKfycbx8AWFeevJZ9q4nfg5yBsrAYv5acMTttH4onBkB7j3Wh0riHQrSrljUI2iaothcw_EZ/exec";

// --- Application State ---
let products = [];
let settings = {};
let currentViewProduct = null; // Product loaded in detail modal
let uploadImageBase64 = "";    // Holds image files converted to Base64 in Add Form

// --- DOM Elements ---
// Views
const storeView = document.getElementById("store-view");
const adminView = document.getElementById("admin-view");

// Navigation
const navStore = document.getElementById("nav-store");
const navAdminBtn = document.getElementById("nav-admin-btn");
const adminLogoutBtn = document.getElementById("admin-logout-btn");

// Modals
const adminAuthModal = document.getElementById("admin-auth-modal");
const authModalClose = document.getElementById("auth-modal-close");
const adminAuthForm = document.getElementById("admin-auth-form");
const adminPasscode = document.getElementById("admin-passcode");
const authErrorMsg = document.getElementById("auth-error-msg");
const toggleAuthPassword = document.getElementById("toggle-auth-password");

const productDetailModal = document.getElementById("product-detail-modal");
const detailModalClose = document.getElementById("detail-modal-close");

// Store Catalog
const productsGrid = document.getElementById("products-grid");
const noProductsMessage = document.getElementById("no-products-message");
const searchInput = document.getElementById("search-input");
const categoryFiltersList = document.getElementById("category-filters-list");

// Detail Modal / Order Form
const modalBadge = document.getElementById("modal-badge");
const modalImage = document.getElementById("modal-image");
const modalCategory = document.getElementById("modal-category");
const modalTitle = document.getElementById("modal-title");
const modalPrice = document.getElementById("modal-price");
const modalDescription = document.getElementById("modal-description");
const whatsappOrderForm = document.getElementById("whatsapp-order-form");
const orderNote = document.getElementById("order-note");
const orderQuantity = document.getElementById("order-quantity");
const orderGiftWrap = document.getElementById("order-gift-wrap");
const qtyMinusBtn = document.getElementById("qty-minus-btn");
const qtyPlusBtn = document.getElementById("qty-plus-btn");
const summarySubtotal = document.getElementById("summary-subtotal");
const summaryGiftWrapLine = document.getElementById("summary-gift-wrap-line");
const summaryGiftWrapFee = document.getElementById("summary-gift-wrap-fee");
const summaryTotal = document.getElementById("summary-total");
const btnBackToStore = document.getElementById("btn-back-to-store");

// Admin Tabs & Sidebar
const adminMenuButtons = document.querySelectorAll(".admin-menu-btn");
const adminTabContents = document.querySelectorAll(".admin-tab-content");
const goToAddProductBtn = document.getElementById("go-to-add-product-btn");

// Admin Product Form
const productForm = document.getElementById("product-form");
const productFormTitle = document.getElementById("product-form-title");
const productFormDesc = document.getElementById("product-form-desc");
const editProductId = document.getElementById("edit-product-id");
const productTitle = document.getElementById("product-title");
const productCategory = document.getElementById("product-category");
const productPrice = document.getElementById("product-price");
const productBadge = document.getElementById("product-badge");
const productDescription = document.getElementById("product-description");
const productWhatsapp = document.getElementById("product-whatsapp");
const saveProductBtn = document.getElementById("save-product-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const resetProductFormBtn = document.getElementById("reset-product-form-btn");

// Admin Image Mode Toggles
const modeFileBtn = document.getElementById("mode-file-btn");
const modeUrlBtn = document.getElementById("mode-url-btn");
const modeSampleBtn = document.getElementById("mode-sample-btn");
const imageFileGroup = document.getElementById("image-file-group");
const imageUrlGroup = document.getElementById("image-url-group");
const imageSampleGroup = document.getElementById("image-sample-group");
const dragDropArea = document.getElementById("drag-drop-area");
const productImageFile = document.getElementById("product-image-file");
const productImageUrl = document.getElementById("product-image-url");
const presetCards = document.querySelectorAll(".preset-card");
const imagePreviewWrapper = document.getElementById("image-preview-wrapper");
const imagePreviewImg = document.getElementById("image-preview-img");
const removePreviewBtn = document.getElementById("remove-preview-btn");

// Admin Settings
const settingsForm = document.getElementById("settings-form");
const settingsShopName = document.getElementById("settings-shop-name");
const settingsShopTagline = document.getElementById("settings-shop-tagline");
const settingsWhatsapp = document.getElementById("settings-whatsapp");
const settingsPasscode = document.getElementById("settings-passcode");
const toggleSettingsPassword = document.getElementById("toggle-settings-password");
const btnLoadSamples = document.getElementById("btn-load-samples");
const btnClearDatabase = document.getElementById("btn-clear-database");

// Admin Products Table
const adminProductsTableBody = document.getElementById("admin-products-table-body");
const adminEmptyTable = document.getElementById("admin-empty-table");

// Dynamic Branding
const shopNameDisplays = [
  document.getElementById("shop-name-display"),
  document.getElementById("footer-shop-name")
];
const shopTaglineDisplay = document.getElementById("shop-tagline-display");

// Toast Container
const toastContainer = document.getElementById("toast-container");

// --- Initialization ---
function init() {
  // Load settings
  const storedSettings = localStorage.getItem("craft_shop_settings");
  if (storedSettings) {
    settings = JSON.parse(storedSettings);
  } else {
    settings = { ...DEFAULT_SETTINGS };
    localStorage.setItem("craft_shop_settings", JSON.stringify(settings));
  }

  // Load products
  const storedProducts = localStorage.getItem("craft_shop_products");
  if (storedProducts) {
    products = JSON.parse(storedProducts);
  } else {
    products = [ ...DEFAULT_PRODUCTS ];
    localStorage.setItem("craft_shop_products", JSON.stringify(products));
  }

  applyBranding();
  renderStorefront();
  renderAdminProducts();
  populateSettingsForm();
  
  // Initialize Lucide Icons
  lucide.createIcons();

  // Set up event listeners
  setupEventListeners();

  // Ask for GPS location on page load to check delivery
  checkDeliveryLocation(true);
}

// --- Geolocation Delivery Check ---
function checkDeliveryLocation(auto = false) {
  // Check secure context
  const isSecure = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const warningEl = document.getElementById("secure-context-warning");
  if (!isSecure && warningEl) {
    warningEl.classList.remove("hidden");
  }

  if (!navigator.geolocation) {
    updateDeliveryStatus("error", "Geolocation is not supported by your browser.");
    return;
  }

  const gateOverlay = document.getElementById("location-gate-overlay");

  if (auto) {
    // If auto checking on load, see if user has already checked
    const checked = localStorage.getItem("delivery_checked");
    if (checked) {
      const result = JSON.parse(checked);
      updateDeliveryStatus(result.allowed ? "success" : "info", result.message);
      if (result.allowed) {
        if (gateOverlay) {
          gateOverlay.classList.add("hidden");
          document.body.style.overflow = "";
        }
        return;
      }
    }
  }

  // Force scroll lock on load if not verified yet
  if (gateOverlay && (!localStorage.getItem("delivery_checked") || !JSON.parse(localStorage.getItem("delivery_checked")).allowed)) {
    gateOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  updateDeliveryStatus("loading", "Checking delivery feasibility...");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      
      updateDeliveryStatus("loading", "Verifying feasibility status...");

      // Send to server
      fetch(BACKEND_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain" // text/plain prevents CORS preflight OPTIONS blocking in Google Apps Script
        },
        body: JSON.stringify({ latitude: lat, longitude: lon })
      })
      .then(res => {
        if (!res.ok) throw new Error("Location check failed");
        return res.json();
      })
      .then(data => {
        if (data.allowed) {
          updateDeliveryStatus("success", data.message);
          showToast("success", data.message);
          
          // Dismiss mandatory gate
          if (gateOverlay) {
            gateOverlay.classList.add("hidden");
            document.body.style.overflow = "";
          }
        } else {
          updateDeliveryStatus("info", data.message);
          showToast("info", data.message);
          
          // Keep mandatory gate active
          if (gateOverlay) {
            gateOverlay.classList.remove("hidden");
            document.body.style.overflow = "hidden";
          }
        }
        localStorage.setItem("delivery_checked", JSON.stringify(data));
      })
      .catch(err => {
        updateDeliveryStatus("error", "Feasibility verification failed on server.");
        showToast("error", "Failed to verify delivery feasibility.");
      });
    },
    (error) => {
      let msg = "Feasibility check requires location permissions. Please allow GPS.";
      if (error.code === error.POSITION_UNAVAILABLE) msg = "Location information is unavailable.";
      if (error.code === error.TIMEOUT) msg = "Feasibility check request timed out.";
      
      updateDeliveryStatus("error", msg);
      if (!auto) {
        showToast("error", msg);
      }
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

function updateDeliveryStatus(type, message) {
  const deliveryStatusMsg = document.getElementById("delivery-status-msg");
  const gateStatusMsg = document.getElementById("gate-status-msg");
  
  let icon = "";
  if (type === "loading") {
    icon = `<span class="spinner-icon">⏳</span>`;
  } else if (type === "success") {
    icon = `<i data-lucide="check-circle" class="text-success"></i>`;
  } else if (type === "error") {
    icon = `<i data-lucide="alert-circle" class="text-danger"></i>`;
  } else {
    icon = `<i data-lucide="info" class="text-info"></i>`;
  }

  // Update footer status bar
  if (deliveryStatusMsg) {
    deliveryStatusMsg.className = `delivery-status-msg ${type}`;
    deliveryStatusMsg.innerHTML = `${icon} <span>${message}</span>`;
  }

  // Update blocker modal status
  if (gateStatusMsg) {
    gateStatusMsg.className = `gate-status-box ${type}`;
    gateStatusMsg.innerHTML = `${icon} <span>${message}</span>`;
  }

  lucide.createIcons();
}

// --- Branding & Settings Update ---
function applyBranding() {
  shopNameDisplays.forEach(el => {
    if (el) el.textContent = settings.shopName || "CraftyHand";
  });
  if (shopTaglineDisplay) {
    shopTaglineDisplay.textContent = settings.shopTagline || "Beautiful Handcrafted Creations - Made with Love";
  }
  document.title = `${settings.shopName} - Premium Handmade Crafts Store`;
}

function populateSettingsForm() {
  if (settingsShopName) settingsShopName.value = settings.shopName;
  if (settingsShopTagline) settingsShopTagline.value = settings.shopTagline;
  if (settingsWhatsapp) settingsWhatsapp.value = settings.whatsappNumber;
  if (settingsPasscode) settingsPasscode.value = "";
}

// --- Storefront Rendering ---
function renderStorefront(filterCategory = "all", searchQuery = "") {
  if (!productsGrid) return;
  productsGrid.innerHTML = "";

  const query = searchQuery.trim().toLowerCase();
  
  const filteredProducts = products.filter(product => {
    const matchesCategory = filterCategory === "all" || product.category === filterCategory;
    const matchesSearch = product.title.toLowerCase().includes(query) || 
                          product.description.toLowerCase().includes(query) || 
                          product.category.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  if (filteredProducts.length === 0) {
    productsGrid.classList.add("hidden");
    noProductsMessage.classList.remove("hidden");
    return;
  }

  productsGrid.classList.remove("hidden");
  noProductsMessage.classList.add("hidden");

  filteredProducts.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    
    const badgeHTML = product.badge ? `<span class="product-card-badge">${product.badge}</span>` : "";
    
    card.innerHTML = `
      <div class="product-img-wrapper">
        ${badgeHTML}
        <img src="${product.image}" alt="${product.title}" loading="lazy">
      </div>
      <div class="product-info">
        <div class="product-meta">
          <span class="product-category">${product.category}</span>
          <span class="product-price">$${Number(product.price).toFixed(2)}</span>
        </div>
        <h3 class="product-title">${product.title}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-actions">
          <button class="buy-btn" data-id="${product.id}">
            <i data-lucide="shopping-bag"></i> View Details & Buy
          </button>
        </div>
      </div>
    `;
    
    // Wire up Detail Modal click handler
    card.querySelector(".buy-btn").addEventListener("click", () => {
      openDetailModal(product);
    });

    productsGrid.appendChild(card);
  });

  lucide.createIcons();
}

// --- Admin Section Rendering ---
function renderAdminProducts() {
  if (!adminProductsTableBody) return;
  adminProductsTableBody.innerHTML = "";

  if (products.length === 0) {
    adminProductsTableBody.parentElement.classList.add("hidden");
    adminEmptyTable.classList.remove("hidden");
    return;
  }

  adminProductsTableBody.parentElement.classList.remove("hidden");
  adminEmptyTable.classList.add("hidden");

  products.forEach(product => {
    const tr = document.createElement("tr");
    
    const displayPhone = product.whatsapp ? product.whatsapp : `${settings.whatsappNumber} (Default)`;
    
    tr.innerHTML = `
      <td>
        <div class="admin-product-cell">
          <img src="${product.image}" class="admin-product-thumb" alt="${product.title}">
          <div class="admin-product-info">
            <h4>${product.title}</h4>
            ${product.badge ? `<span class="admin-badge-span">${product.badge}</span>` : ""}
          </div>
        </div>
      </td>
      <td><span class="badge-td">${product.category}</span></td>
      <td><strong>$${Number(product.price).toFixed(2)}</strong></td>
      <td><small>${displayPhone}</small></td>
      <td>
        <div class="admin-table-actions">
          <button class="icon-btn edit-btn" data-id="${product.id}" title="Edit Product">
            <i data-lucide="edit-3"></i>
          </button>
          <button class="icon-btn delete-btn" data-id="${product.id}" title="Delete Product">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    `;

    // Action clicks
    tr.querySelector(".edit-btn").addEventListener("click", () => {
      loadProductIntoEditForm(product);
    });

    tr.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm(`Are you sure you want to delete "${product.title}"? This cannot be undone.`)) {
        deleteProduct(product.id);
      }
    });

    adminProductsTableBody.appendChild(tr);
  });

  lucide.createIcons();
}

// --- Navigation Operations ---
function showView(viewId) {
  if (viewId === "store") {
    storeView.classList.add("active");
    adminView.classList.add("hidden");
    adminView.classList.remove("active");
    navStore.classList.add("active");
    navAdminBtn.classList.remove("active");
    renderStorefront();
  } else if (viewId === "admin") {
    storeView.classList.remove("active");
    adminView.classList.remove("hidden");
    adminView.classList.add("active");
    navStore.classList.remove("active");
    navAdminBtn.classList.add("active");
    renderAdminProducts();
  }
}

// --- Detail & Checkout Modal ---
function openDetailModal(product) {
  currentViewProduct = product;
  
  // Fill text contents
  if (product.badge) {
    modalBadge.textContent = product.badge;
    modalBadge.classList.remove("hidden");
  } else {
    modalBadge.classList.add("hidden");
  }
  
  modalImage.src = product.image;
  modalCategory.textContent = product.category;
  modalTitle.textContent = product.title;
  modalPrice.textContent = `$${Number(product.price).toFixed(2)}`;
  modalDescription.textContent = product.description;
  
  // Reset Form
  orderNote.value = "";
  orderQuantity.value = 1;
  orderGiftWrap.checked = false;
  
  // Initial Calculation
  calculateOrderSummary();
  
  // Open modal
  productDetailModal.classList.remove("hidden");
  document.body.style.overflow = "hidden"; // Disable scroll background
  
  lucide.createIcons();
}

function closeDetailModal() {
  productDetailModal.classList.add("hidden");
  document.body.style.overflow = "";
  currentViewProduct = null;
}

function calculateOrderSummary() {
  if (!currentViewProduct) return;
  
  const price = Number(currentViewProduct.price);
  const qty = parseInt(orderQuantity.value) || 1;
  const hasGiftWrap = orderGiftWrap.checked;
  const giftWrapFee = hasGiftWrap ? 2.50 : 0;
  
  const subtotalVal = price * qty;
  const totalVal = subtotalVal + giftWrapFee;
  
  summarySubtotal.textContent = `$${subtotalVal.toFixed(2)}`;
  
  if (hasGiftWrap) {
    summaryGiftWrapLine.classList.remove("hidden");
    summaryGiftWrapFee.textContent = `$${giftWrapFee.toFixed(2)}`;
  } else {
    summaryGiftWrapLine.classList.add("hidden");
  }
  
  summaryTotal.textContent = `$${totalVal.toFixed(2)}`;
}

// Open pre-populated WhatsApp message
function executeCheckout(e) {
  e.preventDefault();
  if (!currentViewProduct) return;

  const targetNumber = currentViewProduct.whatsapp ? currentViewProduct.whatsapp : settings.whatsappNumber;
  
  // Format the number to keep digits only
  const cleanNumber = targetNumber.replace(/[^\d]/g, '');
  
  if (!cleanNumber) {
    showToast("error", "No WhatsApp number configured for checkout!");
    return;
  }

  const qty = parseInt(orderQuantity.value) || 1;
  const customizationNote = orderNote.value.trim() ? orderNote.value.trim() : "None";
  const giftWrap = orderGiftWrap.checked ? "Yes (+$2.50)" : "No";
  
  const price = Number(currentViewProduct.price);
  const total = (price * qty + (orderGiftWrap.checked ? 2.50 : 0)).toFixed(2);
  
  // Build professional markdown style text for WhatsApp
  const messageText = `Hi! I would like to order this handcrafted creation:

🛍️ *Product Name:* ${currentViewProduct.title}
🏷️ *Category:* ${currentViewProduct.category}
🔢 *Quantity:* ${qty}
🎨 *Customization Notes:* ${customizationNote}
🎁 *Gift Wrapping:* ${giftWrap}

💵 *Total Amount:* $${total}

Please let me know how to proceed with payment and shipping. Thank you!`;

  const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(messageText)}`;
  
  // Open WhatsApp in new window
  window.open(waUrl, "_blank");
  closeDetailModal();
  showToast("success", "Order details compiled! Opening WhatsApp chat...");
}

// --- Admin Operations ---
function authenticateAdmin(e) {
  e.preventDefault();
  const entered = adminPasscode.value;
  if (entered === settings.adminPasscode) {
    authErrorMsg.classList.add("hidden");
    adminPasscode.value = "";
    adminAuthModal.classList.add("hidden");
    document.body.style.overflow = "";
    showView("admin");
    showToast("success", "Welcome back, Admin!");
  } else {
    authErrorMsg.classList.remove("hidden");
    adminPasscode.select();
    showToast("error", "Authentication failed. Incorrect passcode.");
  }
}

function handleAdminTabSwitch(tabName) {
  adminMenuButtons.forEach(btn => {
    if (btn.getAttribute("data-tab") === tabName) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  adminTabContents.forEach(tab => {
    if (tab.id === `tab-${tabName}`) {
      tab.classList.add("active");
      tab.classList.remove("hidden");
    } else {
      tab.classList.remove("active");
      tab.classList.add("hidden");
    }
  });
  
  // Clear file upload preview states if leaving add form
  if (tabName !== "admin-add-product") {
    resetProductForm();
  }
}

// --- Image Picker Functionality ---
function switchImageUploadMode(mode) {
  modeFileBtn.classList.remove("active");
  modeUrlBtn.classList.remove("active");
  modeSampleBtn.classList.remove("active");

  imageFileGroup.classList.add("hidden");
  imageUrlGroup.classList.add("hidden");
  imageSampleGroup.classList.add("hidden");

  presetCards.forEach(c => c.classList.remove("selected"));

  if (mode === "file") {
    modeFileBtn.classList.add("active");
    imageFileGroup.classList.remove("hidden");
  } else if (mode === "url") {
    modeUrlBtn.classList.add("active");
    imageUrlGroup.classList.remove("hidden");
  } else if (mode === "sample") {
    modeSampleBtn.classList.add("active");
    imageSampleGroup.classList.remove("hidden");
  }
}

function handleImageFileSelect(file) {
  if (!file) return;
  if (!file.type.match("image.*")) {
    showToast("error", "Please upload a valid image file.");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast("error", "File size exceeds 5MB limit.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    uploadImageBase64 = e.target.result;
    showImagePreview(uploadImageBase64);
  };
  reader.readAsDataURL(file);
}

function showImagePreview(src) {
  imagePreviewImg.src = src;
  imagePreviewWrapper.classList.remove("hidden");
}

function removeImagePreview() {
  uploadImageBase64 = "";
  productImageFile.value = "";
  productImageUrl.value = "";
  presetCards.forEach(c => c.classList.remove("selected"));
  imagePreviewWrapper.classList.add("hidden");
  imagePreviewImg.src = "";
}

// --- Admin Form Operations ---
function handleProductFormSubmit(e) {
  e.preventDefault();
  
  const title = productTitle.value.trim();
  const category = productCategory.value;
  const price = parseFloat(productPrice.value);
  const badge = productBadge.value.trim();
  const description = productDescription.value.trim();
  const customWhatsapp = productWhatsapp.value.trim();
  const editId = editProductId.value;

  // Resolve Image source
  let finalImage = "";
  if (modeFileBtn.classList.contains("active")) {
    finalImage = uploadImageBase64;
  } else if (modeUrlBtn.classList.contains("active")) {
    finalImage = productImageUrl.value.trim();
  } else if (modeSampleBtn.classList.contains("active")) {
    const selectedPreset = document.querySelector(".preset-card.selected");
    finalImage = selectedPreset ? selectedPreset.getAttribute("data-url") : "";
  }

  // Fallback if editing is empty or fields are missing
  if (!finalImage) {
    // If editing, preserve old image, else throw error
    if (editId) {
      const match = products.find(p => p.id === editId);
      finalImage = match ? match.image : "";
    }
    
    if (!finalImage) {
      showToast("error", "Please select or upload a product image!");
      return;
    }
  }

  if (editId) {
    // Update Mode
    const index = products.findIndex(p => p.id === editId);
    if (index !== -1) {
      products[index] = {
        ...products[index],
        title,
        category,
        price,
        badge,
        description,
        image: finalImage,
        whatsapp: customWhatsapp
      };
      showToast("success", "Product details updated successfully!");
    }
  } else {
    // Insert Mode
    const newProduct = {
      id: "prod-" + Date.now(),
      title,
      category,
      price,
      badge,
      description,
      image: finalImage,
      whatsapp: customWhatsapp
    };
    products.unshift(newProduct);
    showToast("success", "New craft product listed successfully!");
  }

  // Save State
  localStorage.setItem("craft_shop_products", JSON.stringify(products));
  
  // Refresh & Reset views
  resetProductForm();
  renderAdminProducts();
  handleAdminTabSwitch("admin-products");
}

function loadProductIntoEditForm(product) {
  // Title edits
  productFormTitle.textContent = "Edit Craft Product Listing";
  productFormDesc.textContent = "Modify specifications below for this artisan item.";
  saveProductBtn.innerHTML = "Save Changes <i data-lucide='check'></i>";
  cancelEditBtn.classList.remove("hidden");
  
  // Fill details
  editProductId.value = product.id;
  productTitle.value = product.title;
  productCategory.value = product.category;
  productPrice.value = product.price;
  productBadge.value = product.badge || "";
  productDescription.value = product.description;
  productWhatsapp.value = product.whatsapp || "";

  // Reset image panels and show active preview
  removeImagePreview();
  showImagePreview(product.image);
  
  // Default edit image fields to URL for ease, or keep empty since the preview holds it
  if (product.image.startsWith("data:image")) {
    switchImageUploadMode("file");
    uploadImageBase64 = product.image;
  } else if (product.image.startsWith("images/")) {
    switchImageUploadMode("sample");
    // Find preset and select
    presetCards.forEach(c => {
      if (c.getAttribute("data-url") === product.image) {
        c.classList.add("selected");
      }
    });
  } else {
    switchImageUploadMode("url");
    productImageUrl.value = product.image;
  }

  // Navigate to add-product tab
  handleAdminTabSwitch("admin-add-product");
  lucide.createIcons();
}

function resetProductForm() {
  productForm.reset();
  editProductId.value = "";
  productFormTitle.textContent = "Add New Craft Product";
  productFormDesc.textContent = "Provide details below to list a new masterpiece in your catalog.";
  saveProductBtn.innerHTML = "Save Product Listing <i data-lucide='check'></i>";
  cancelEditBtn.classList.add("hidden");
  removeImagePreview();
  switchImageUploadMode("file");
  lucide.createIcons();
}

function deleteProduct(id) {
  products = products.filter(p => p.id !== id);
  localStorage.setItem("craft_shop_products", JSON.stringify(products));
  renderAdminProducts();
  showToast("success", "Product deleted successfully.");
}

// --- Admin Settings Operations ---
function handleSettingsSubmit(e) {
  e.preventDefault();
  
  const shopName = settingsShopName.value.trim();
  const shopTagline = settingsShopTagline.value.trim();
  const whatsappNumber = settingsWhatsapp.value.trim();
  const newPasscode = settingsPasscode.value;

  settings.shopName = shopName;
  settings.shopTagline = shopTagline;
  settings.whatsappNumber = whatsappNumber;

  if (newPasscode.trim()) {
    settings.adminPasscode = newPasscode;
    showToast("success", "Configurations and admin passcode saved!");
  } else {
    showToast("success", "Boutique configurations saved successfully!");
  }

  localStorage.setItem("craft_shop_settings", JSON.stringify(settings));
  
  applyBranding();
  populateSettingsForm();
}

// --- System / Database Actions ---
function restoreSampleData() {
  if (confirm("Restore all sample products? Your existing custom listings will be overwritten.")) {
    products = [ ...DEFAULT_PRODUCTS ];
    localStorage.setItem("craft_shop_products", JSON.stringify(products));
    renderAdminProducts();
    showToast("success", "Sample data loaded successfully.");
  }
}

function wipeDatabase() {
  if (confirm("🚨 WARNING: This will delete ALL custom products and reset settings to default. Proceed?")) {
    localStorage.clear();
    settings = { ...DEFAULT_SETTINGS };
    products = [ ...DEFAULT_PRODUCTS ];
    localStorage.setItem("craft_shop_settings", JSON.stringify(settings));
    localStorage.setItem("craft_shop_products", JSON.stringify(products));
    
    applyBranding();
    populateSettingsForm();
    renderAdminProducts();
    showToast("success", "Database wiped and restored to default settings.");
    showView("store");
  }
}

// --- Toast System Helper ---
function showToast(type, message) {
  const toast = document.createElement("div");
  toast.className = `toast ${type}-toast`;
  
  let icon = "check-circle";
  if (type === "error") icon = "alert-triangle";
  if (type === "info") icon = "info";

  toast.innerHTML = `
    <i data-lucide="${icon}"></i>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);
  lucide.createIcons();

  // Animate in
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  // Remove toast
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  // Store navigation
  navStore.addEventListener("click", (e) => {
    e.preventDefault();
    showView("store");
  });

  // Admin Modal trigger
  navAdminBtn.addEventListener("click", () => {
    if (adminView.classList.contains("active")) {
      // Already inside admin view, toggles back to store
      showView("store");
    } else {
      adminAuthModal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
      adminPasscode.focus();
    }
  });

  authModalClose.addEventListener("click", () => {
    adminAuthModal.classList.add("hidden");
    document.body.style.overflow = "";
    authErrorMsg.classList.add("hidden");
    adminPasscode.value = "";
  });

  adminAuthForm.addEventListener("submit", authenticateAdmin);

  // Toggle visible passcode in authentication
  toggleAuthPassword.addEventListener("click", () => {
    const isPass = adminPasscode.type === "password";
    adminPasscode.type = isPass ? "text" : "password";
    toggleAuthPassword.querySelector("i").setAttribute("data-lucide", isPass ? "eye-off" : "eye");
    lucide.createIcons();
  });

  // Logout Admin View
  adminLogoutBtn.addEventListener("click", () => {
    showView("store");
    showToast("info", "Logged out from admin panel.");
  });

  // Admin Tab selection
  adminMenuButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      if (tab) handleAdminTabSwitch(tab);
    });
  });

  goToAddProductBtn.addEventListener("click", () => {
    handleAdminTabSwitch("admin-add-product");
  });

  cancelEditBtn.addEventListener("click", () => {
    handleAdminTabSwitch("admin-products");
  });

  resetProductFormBtn.addEventListener("click", resetProductForm);

  // Store filter category clicks
  const filters = categoryFiltersList.querySelectorAll(".filter-btn");
  filters.forEach(btn => {
    btn.addEventListener("click", () => {
      filters.forEach(f => f.classList.remove("active"));
      btn.classList.add("active");
      renderStorefront(btn.getAttribute("data-category"), searchInput.value);
    });
  });

  // Store search queries
  searchInput.addEventListener("input", () => {
    const activeFilter = categoryFiltersList.querySelector(".filter-btn.active").getAttribute("data-category");
    renderStorefront(activeFilter, searchInput.value);
  });

  // Detail checkout modal buttons
  detailModalClose.addEventListener("click", closeDetailModal);
  btnBackToStore.addEventListener("click", closeDetailModal);

  // Quantity updates
  qtyMinusBtn.addEventListener("click", () => {
    let val = parseInt(orderQuantity.value) || 1;
    if (val > 1) {
      orderQuantity.value = val - 1;
      calculateOrderSummary();
    }
  });

  qtyPlusBtn.addEventListener("click", () => {
    let val = parseInt(orderQuantity.value) || 1;
    orderQuantity.value = val + 1;
    calculateOrderSummary();
  });

  orderQuantity.addEventListener("input", () => {
    let val = parseInt(orderQuantity.value);
    if (isNaN(val) || val < 1) orderQuantity.value = 1;
    calculateOrderSummary();
  });

  orderGiftWrap.addEventListener("change", calculateOrderSummary);

  whatsappOrderForm.addEventListener("submit", executeCheckout);

  // Admin Image tabs configuration
  modeFileBtn.addEventListener("click", () => switchImageUploadMode("file"));
  modeUrlBtn.addEventListener("click", () => switchImageUploadMode("url"));
  modeSampleBtn.addEventListener("click", () => switchImageUploadMode("sample"));

  // File Upload Handlers (Input change & Drag & Drop)
  productImageFile.addEventListener("change", (e) => {
    handleImageFileSelect(e.target.files[0]);
  });

  dragDropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dragDropArea.classList.add("dragover");
  });

  dragDropArea.addEventListener("dragleave", () => {
    dragDropArea.classList.remove("dragover");
  });

  dragDropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    dragDropArea.classList.remove("dragover");
    handleImageFileSelect(e.dataTransfer.files[0]);
  });

  // Image URL direct previews
  productImageUrl.addEventListener("input", () => {
    const url = productImageUrl.value.trim();
    if (url) {
      showImagePreview(url);
    } else {
      removeImagePreview();
    }
  });

  // Image presets clicks
  presetCards.forEach(card => {
    card.addEventListener("click", () => {
      presetCards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      const url = card.getAttribute("data-url");
      showImagePreview(url);
    });
  });

  removePreviewBtn.addEventListener("click", removeImagePreview);

  // Product Form creation
  productForm.addEventListener("submit", handleProductFormSubmit);

  // Settings Save
  settingsForm.addEventListener("submit", handleSettingsSubmit);

  toggleSettingsPassword.addEventListener("click", () => {
    const isPass = settingsPasscode.type === "password";
    settingsPasscode.type = isPass ? "text" : "password";
    toggleSettingsPassword.querySelector("i").setAttribute("data-lucide", isPass ? "eye-off" : "eye");
    lucide.createIcons();
  });

  // Admin system controls
  btnLoadSamples.addEventListener("click", restoreSampleData);
  btnClearDatabase.addEventListener("click", wipeDatabase);

  // Delivery Check Event Listener
  const btnCheckDelivery = document.getElementById("btn-check-delivery");
  if (btnCheckDelivery) {
    btnCheckDelivery.addEventListener("click", () => {
      checkDeliveryLocation(false);
    });
  }

  const btnRequestGateLocation = document.getElementById("btn-request-gate-location");
  if (btnRequestGateLocation) {
    btnRequestGateLocation.addEventListener("click", () => {
      checkDeliveryLocation(false);
    });
  }
}

// --- Bootstrap ---
document.addEventListener("DOMContentLoaded", init);
