document.addEventListener('DOMContentLoaded', () => {
    const salesForm = document.getElementById('sales-form');
    const salesList = document.getElementById('sales-list');
    const totalRevenueElem = document.getElementById('total-revenue');
    const totalUnitsElem = document.getElementById('total-units');
    const bestSellerElem = document.getElementById('best-seller');
    const clearBtn = document.getElementById('clear-btn');
    const searchInput = document.getElementById('search-input');
    const emptyState = document.getElementById('empty-state');

    // Cargar datos locales
    let sales = JSON.parse(localStorage.getItem('trattoria_sales')) || [];

    function updateDashboard(filteredSales) {
        let totalRevenue = 0;
        let totalUnits = 0;
        const productCounts = {};

        filteredSales.forEach(sale => {
            const subtotal = sale.quantity * sale.price;
            totalRevenue += subtotal;
            totalUnits += Number(sale.quantity);

            // Conteo para producto estrella
            const name = sale.pastaType.trim();
            productCounts[name] = (productCounts[name] || 0) + Number(sale.quantity);
        });

        // Calcular producto estrella general (sobre todas las ventas)
        let bestSeller = '-';
        let maxCount = 0;
        if (sales.length > 0) {
            const globalCounts = {};
            sales.forEach(s => {
                globalCounts[s.pastaType.trim()] = (globalCounts[s.pastaType.trim()] || 0) + Number(s.quantity);
            });
            for (let prod in globalCounts) {
                if (globalCounts[prod] > maxCount) {
                    maxCount = globalCounts[prod];
                    bestSeller = prod;
                }
            }
        }

        totalRevenueElem.textContent = `$${totalRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        totalUnitsElem.textContent = totalUnits.toLocaleString('es-AR');
        bestSellerElem.textContent = bestSeller;
    }

    function renderSales(filterText = '') {
        salesList.innerHTML = '';

        // Filtrar por texto de búsqueda
        const filteredSales = sales.filter(sale => 
            sale.pastaType.toLowerCase().includes(filterText.toLowerCase())
        );

        if (filteredSales.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }

        // Mostrar ordenadas de más nueva a más vieja (invertir array temporalmente para la vista)
        const reversedSales = [...filteredSales].reverse();

        reversedSales.forEach((sale) => {
            // Encontrar el índice real en el array principal `sales`
            const realIndex = sales.indexOf(sale);
            const row = document.createElement('tr');
            const saleTotal = sale.quantity * sale.price;

            row.innerHTML = `
                <td>${sale.date}</td>
                <td><strong>${escapeHTML(sale.pastaType)}</strong></td>
                <td>${sale.quantity}</td>
                <td>$${Number(sale.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                <td><strong>$${saleTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></td>
                <td><button class="btn-delete-row" data-index="${realIndex}" title="Eliminar venta">🗑️</button></td>
            `;

            salesList.appendChild(row);
        });

        updateDashboard(sales);
        localStorage.setItem('trattoria_sales', JSON.stringify(sales));
    }

    // Función de seguridad básica contra caracteres extraños
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    // Registrar nueva venta
    salesForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const pastaType = document.getElementById('pasta-type').value;
        const quantity = document.getElementById('quantity').value;
        const price = document.getElementById('price').value;
        
        const now = new Date();
        const date = `${now.toLocaleDateString()} - ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        const newSale = {
            date,
            pastaType,
            quantity: Number(quantity),
            price: Number(price)
        };

        sales.push(newSale);
        renderSales(searchInput.value);

        salesForm.reset();
        document.getElementById('quantity').value = 1;
        document.getElementById('pasta-type').focus();
    });

    // Eliminar venta individual
    salesList.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.btn-delete-row');
        if (deleteBtn) {
            const index = deleteBtn.getAttribute('data-index');
            sales.splice(index, 1);
            renderSales(searchInput.value);
        }
    });

    // Buscar en tiempo real
    searchInput.addEventListener('input', (e) => {
        renderSales(e.target.value);
    });

    // Borrar todo el historial
    clearBtn.addEventListener('click', () => {
        if (sales.length === 0) return;
        if (confirm('¿Estás seguro de que deseas eliminar permanentemente todo el historial?')) {
            sales = [];
            renderSales();
            searchInput.value = '';
        }
    });

    // Inicializar app
    renderSales();
});