define(function(){
    // input value is in cents
    function _formatCents(value) {
        var sign = '';
        if (value < 0) sign = '-';
        
        value = Math.abs(value);
        var dollars = Math.floor(value/100);
        var cents = ((100 + (value % 100)) + "").substr(1,2);
        return sign + '$' +  _formatThousands(dollars) + '.' + cents;
    }

    function _formatThousands(value) {
        var sign = '';

        if (value < 0) sign = '-';

        value = Math.abs(value);
        if (value < 1000) return sign + value;
        value = value + "";
        var result = "";
        for (var i = 0; i < value.length; i++) {
            if ((value.length - i) % 3 == 0 && i > 0)
                result += ',';
            result += value[i];
        }
        return sign + result; 
    }

    function _padd(value,zeros){
        return (Math.pow(10,zeros) + value).toString().substr(1,zeros);
    }

    var _months = ['January','February','March','April',
        'May','June','July','August','September','October', 
        'November', 'December']

    var _days = ['Sunday', 'Monday', 'Tuesday',
        'Wednesday', 'Thursday', 'Friday', 'Saturday']

    var _daysShort = ['Sun.', 'Mon.', 'Tue.',
        'Wed.', 'Thu.', 'Fri.', 'Sat.']


    function _formatDate(date) {
        return _daysShort[date.getDay()] + ' ' + _months[date.getMonth()] + ' ' + date.getDate() 
        + ', ' + date.getFullYear(); 
    }

    function _formatDateOnly(date){
        return _months[date.getMonth()] + ' ' + date.getDate() 
        + ', ' + date.getFullYear(); 
    }

    function _formatDayDate(date) {
        return _daysShort[date.getDay()] + ' ' + _months[date.getMonth()] + ' ' + date.getDate()
            + ', ' + date.getFullYear();
    }

    function _formatDateTime(date) {
        return _months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear() + ' ' 
            + _padd(date.getHours(),2) + ':' + _padd(date.getMinutes(),2) + ':' + _padd(date.getSeconds(),2);
    }

    function _formatStringDayDate(date){
        if(date == null) return '';
        return _formatDayDate(new Date(Date.parse(date)));
    }

    function _formatStringDateTime(date){
        if(date == null) return '';
        return _formatDateTime(new Date(Date.parse(date)));
    }

    function _capitalize(value){
        value += '';
        return value[0].toUpperCase() + value.substr(1)
    }

    return {
        cents: _formatCents,
        date_MMM_DD_YYYY: _formatDate,
        dateOnly: _formatDateOnly,
        dateDayDate: _formatDayDate,
        dateTime: _formatDateTime,
        stringDayDate: _formatStringDayDate,
        stringDateTime: _formatStringDateTime,
        capitalize: _capitalize,
        quantity: _formatThousands
    }
});