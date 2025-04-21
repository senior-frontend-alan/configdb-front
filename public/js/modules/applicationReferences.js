/**
 * JS-функции для модуля applicationReferences
 */

// Создаем объект для хранения функций модуля
const moduleFunctions = {};

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

// Форматирует значение поля attribute
function formatAttribute(row) {
    const attributeMap = {
        "1": "ApplicationID",
        "2": "AVP",
        "3": "AVPExist",
        "4": "CommandCode",
        "5": "RequestType",
        "6": "DestinationHost",
        "7": "DestinationRealm",
        "8": "OriginHost",
        "9": "OriginRealm",
        "10": "PeerHost",
        "11": "PipelineProfile",
        "12": "TrafficFlow",
        "13": "InvokeHost",
        "14": "IMSI",
        "15": "IP",
        "16": "MessagePriority",
        "17": "ResultCode",
        "18": "ExperimentalResultCode",
        "19": "HttpUri",
        "20": "CTX"
    };
    
    return attributeMap[row.attribute] || `Неизвестный атрибут (${row.attribute})`;
}
    
// Экспортируем функции
moduleFunctions.isString = isString;
moduleFunctions.amountWithUnits = amountWithUnits;
moduleFunctions.formatAttribute = formatAttribute;

// Возвращаем объект с функциями
module.exports = moduleFunctions;
