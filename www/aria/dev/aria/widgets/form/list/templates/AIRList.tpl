/**
 * Copyright Amadeus
 */
// Default template for List Widget 
{Template {
    $classpath:"aria.widgets.form.list.templates.AIRList",
    $extends:"aria.widgets.form.list.templates.ListTemplate",
    $hasScript:true
}}
    {var inCity=''/}
    {var inCountry=''/}
    
    {macro main()}
    
        // The Div is used to wrap the items with good looking border.
        {@aria:Div data.cfg}
            
                {section {
                    id:'Items',
                    type:"div"
                }}
                <table
                        {if !data.disabled}
                            {on mouseup {fn: "itemClick"} /}
                            {on mouseover {fn: "itemMouseOver"} /}
                        {/if} 
                        
                        cellpadding="0"
                        cellspacing="0"
                        // release hack. table does not take all available width, but does not break the display. FIXME
                        ${(aria.core.Browser.isIE7 && data.cfg.width != null && data.cfg.width <= 0) ? "" : "style='width:100%'"}
                >
                    <tbody {id "suggestionsRows" /}    >
                            
                        {for var i=0;i<data.items.length;i++}
                            {call renderItem(data.items[i], i)/}
                        {/for}
                        
                    </tbody>
                </table>
                {/section}
        {/@aria:Div}
    {/macro}
    
    {macro renderItem(item, itemIdx)}
        <tr class="${_getClassForItem(item)}" data-itemIdx="${itemIdx}">
        
            <td style="padding:0px; border:none;">
                {var suggestion = item.object.value/}
                {var entry = item.object.entry/}
                {if ((suggestion.cityName && !suggestion.airportName) || suggestion.type == 7)}
                    {set inCity = suggestion.cityName/}
                    {set inCountry = suggestion.countryName/}
                    
                    {@aria:Icon    {icon:"autoCompleteAirTrain:multiple_airport"}/}

                {else/}                    
                    {if ((inCity && suggestion.cityName===inCity) && (inCountry && suggestion.countryName===inCountry))}
                        {@aria:Icon    {icon:"autoCompleteAirTrain:sub"}/}
                    {/if}
                    {@aria:Icon    {icon:"autoCompleteAirTrain:airport"}/}
                {/if}
                &nbsp;${suggestion.cityName|startHighlight:entry}, ${suggestion.airportName|startHighlight:entry} (${suggestion.iata|startHighlight:entry})
            </td>
            <td style="text-align:right;color:#666666;padding-left:5px;">
                ${suggestion.countryName}
            </td>
        </tr>
    {/macro}
{/Template}