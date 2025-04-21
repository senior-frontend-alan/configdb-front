/**
 * JS-функции для модуля applicationReferences1
 */
(function(window) {
    // Проверяем, существует ли объект для хранения модулей
    if (!window.jsModules) {
        window.jsModules = {};
    }
    
    // Создаем объект для модуля, если его еще нет
    if (!window.jsModules.applicationReferences1) {
        window.jsModules.applicationReferences1 = {};
    }
    
    // Вспомогательная функция для проверки строкового типа
    function isString(value) {
        return typeof value === 'string' || value instanceof String;
    }
    
    // Форматирует значение с единицами измерения
    function amountWithUnits(r, amount_field, units_field, displaySettings) {
        let amount = r[amount_field];

        if (isString(amount)) {
            amount = parseFloat(amount);
        }

        if (amount != null) {
            amount = amount.toFixed(displaySettings?.roundDecimals ?? 2);
        }

        amount = amount ?? '-';

        const units = r[units_field];
        if (units?.name) {
            return `${amount} ${units.name}`;
        }
        return `${amount}`;
    }
    
    // Форматирует кардинальность
    function cardinalityRepr(r) {
        const minexpr = (r.min_cardinality) ? r.min_cardinality : '0';
        const maxexpr = (r.max_cardinality) ? r.max_cardinality : '*';
        return `${minexpr}..${maxexpr}`;
    }
    
    // Форматирует полное имя
    function formatFullName(obj) {
        if (!obj) return 'Нет данных';
        
        const parts = [];
        if (obj.lastName) parts.push(obj.lastName);
        if (obj.firstName) parts.push(obj.firstName);
        if (obj.middleName) parts.push(obj.middleName);
        
        return parts.length > 0 ? parts.join(' ') : `ID: ${obj.id}`;
    }
    
    // Форматирует дату в локальном формате
    function formatDate(date) {
        if (!date) return 'Дата не указана';
        
        try {
            const dateObj = new Date(date);
            return dateObj.toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return date;
        }
    }
    
    // Форматирует денежную сумму
    function formatCurrency(amount, currency = 'RUB') {
        if (amount == null) return 'Сумма не указана';
        
        const currencySymbols = {
            'RUB': '₽',
            'USD': '$',
            'EUR': '€',
            'GBP': '£'
        };
        
        const symbol = currencySymbols[currency] || currency;
        
        try {
            const formatter = new Intl.NumberFormat('ru-RU', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            
            return `${formatter.format(amount)} ${symbol}`;
        } catch (error) {
            return `${amount} ${symbol}`;
        }
    }
    
    // Экспортируем функции в объект модуля
    window.jsModules.applicationReferences1 = {
        isString,
        amountWithUnits,
        cardinalityRepr,
        formatFullName,
        formatDate,
        formatCurrency
    };
})(window);
