/**
 * Sistema Customizado para Foundry VTT v11 - Adaptado para generic-rpg.css
 */

class MeuAtorSheet extends ActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["meu-sistema", "sheet", "actor"],
            template: "systems/meu-sistema-custom/templates/actor/actor-sheet.html",
            width: 350,
            height: 700,
            tabs: [{ navSelector: ".tabs", contentSelector: ".sheet-body", initial: "bio" }]
        });
    }

    getData() {
        const context = super.getData();
        const actorData = context.data;

        context.system = actorData.system;
        context.flags = actorData.flags;

        // Preparar itens
        this._prepareItems(context);

        return context;
    }

    _prepareItems(context) {
        const inventory = [];
        const spells = [];
        const equippedItems = [];
        const armaduraEquipada = [];
        const armasEquipadas = [];

        for (let i of context.items) {
            i.img = i.img || DEFAULT_TOKEN;
            if (i.type === 'item' || i.type === 'arma' || i.type === 'armadura') {
                i.isItem = i.type === "item";
                i.isArma = i.type === "arma";
                i.isArmadura = i.type === "armadura";

                inventory.push(i);

                if (i.system.equipped) {
                    equippedItems.push(i);

                    if(i.type === 'armadura'){
                        armaduraEquipada.push(i);
                    }

                    if(i.type === 'arma'){
                        i.labelTipoAtaque = i.system.tipoAtaque === 'range' ? 'à Distância' : 'Corpo a Corpo';
                        console.log(i);
                        armasEquipadas.push(i);
                    }
                }                

            } else if (i.type === 'magia') {
                spells.push(i);
            }
        }

        context.inventory = inventory;
        context.spells = spells;
        context.equippedItems = equippedItems;
        context.armaduraEquipada = armaduraEquipada;
        context.armasEquipadas = armasEquipadas;

    }

    activateListeners(html) {
        super.activateListeners(html);

        // Botão de Equipar/Desequipar
        html.find('.item-toggle').click(async ev => {
            const li = $(ev.currentTarget).parents(".item-lista");
            const item = this.actor.items.get(li.data("itemId"));            

            if (item.type === "armadura" && !item.system.equipped) {
                const temOutraArmadura = this.actor.items.some(i => 
                    i.type === "armadura" && 
                    i.system.equipped === true && 
                    i.id !== item.id
                );

                if (temOutraArmadura) {
                    return ui.notifications.warn("Você já possui uma armadura equipada!");
                }
            }

            if (item.type === "arma" && !item.system.equipped) {
                const temOutraArma = this.actor.items.some(i => 
                    i.type === "arma" && 
                    i.system.equipped === true && 
                    i.id !== item.id
                );

                if (temOutraArma) {
                    return ui.notifications.warn("Você já possui uma arma equipada!");
                }
            }
           
            item.update({ "system.equipped": !item.system.equipped });

            const desc = !item.system.equipped ? `Equipou: ${item.name}` : `Desequipou: ${item.name}`;

            this._sendSimpleMsg('', desc);
            await this.actor.render(false);
        });

        // Editar Item
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".item-lista");
            const item = this.actor.items.get(li.data("itemId"));
                        
            item.isSpell    = item.type === 'magia';
            item.isItem     = item.type === 'item';
            item.isTalent   = item.type === 'talento';
            item.isArma     = item.type === 'arma';
            item.isArmadura = item.type === 'armadura';
            
            //if(item.type === 'spell') item.isSpell = true; 
            //if(item.type === 'talento') item.isTalent = true;
            //if(item.type === 'item') item.isItem = true;
              
            item.sheet.render(true);
        });

        // Remover Item
        html.find('.item-delete').click(async ev => {
            const li = $(ev.currentTarget).parents(".item-lista");
            const item = this.actor.items.get(li.data("itemId"));            
            item.delete();
            li.slideUp(200, () => this.render(false));
            await this.actor.render(false);
        });
        

        html.find(".exhaustion-check").click(this._onExhaustionClick.bind(this));

        html.find('.roll-atributos').click(ev => { this._onRollDialog(ev); });

        html.find('.roll-arma').click(ev => { this._onRollDialog(ev); });

        this._createItem(html);     


    }

    async _onExhaustionClick(ev) {
        ev.preventDefault();
        const index = parseInt(ev.currentTarget.dataset.index);
        const currentExhaustion = this.actor.system.exhaustion || 0;
        
        let newValue;
        if (currentExhaustion === index + 1) {
            newValue = index; // Desmarca o último clicado
        } else {
            newValue = index + 1; // Define o novo nível
        }

        await this.actor.update({ "system.exhaustion": newValue }); 
    }

    _createItem(html) {
        html.find('.item-create').click(ev => {
        ev.preventDefault();

        let items = this.actor.items.filter(i => i.type === "item" || i.type === "arma" || i.type === "armadura");
        
        if (items.length > 9) { 
            return ui.notifications.error("O inventário está cheio!");            
        }

        const types = {
            "item": { label: "Item", icon: "fas fa-briefcase" },
            "arma": { label: "Arma", icon: "fas fa-sword" },
            "armadura": { label: "Armadura", icon: "fas fa-shield-alt" }
        };

        let buttonsHtml = `<div class="item-type-selector flexrow" style="gap: 10px; padding: 10px;">`;
        for (let [key, obj] of Object.entries(types)) {
            buttonsHtml += `
            <a class="type-button" data-type="${key}" style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
                <i class="${obj.icon}" style="font-size: 24px; margin-bottom: 5px; color: white;"></i>
                <span style="color: white;">${obj.label}</span>
            </a>`;
        }
        buttonsHtml += `</div>`;

        const d = new Dialog({
            title: "Selecionar Tipo",
            content: buttonsHtml,            
            buttons: {},
            render: html => {
            html.closest('.app').find('.window-content').css("background", "#0f0d15");    
            html.find('.type-button').click(async ev => {
                const type = ev.currentTarget.dataset.type;
                const itemData = {
                name: `Novo ${type.capitalize()}`,
                type: type,
                system: {}
                };
                const [newItem] = await this.actor.createEmbeddedDocuments("Item", [itemData]);
                newItem.sheet.render(true);
                d.close();
            });
            }
        });
        d.render(true);
        });
    }




    async _onRollDialog(ev) {

        ev.preventDefault();
        
        //evita chamar quando clicar no input
        if (ev.target.tagName === "INPUT") return;

        const element = $(ev.currentTarget);

        //const label = element.find('label').text();
        //const attr = element.find('.roll-value').val();

        const dados = event.currentTarget.dataset;
        //console.log('---');
        //console.log(dados);  
        //console.log(dados.desc);  
        //console.log(dados.attr); 

        console.log(dados); 

        if(dados.tipo === 'arma'){
            dados.attr = (dados.tipoataque === 'range') ? this.actor.system.attr.agi : this.actor.system.attr.str;
        }

        const content = `
        <form class="roll-dialog">
        
            <header style="display: grid; grid-template-columns: repeat(1, 1fr);  background: #1a1725; font-weight: bold; font-size: 11px; text-transform: uppercase; color: #7a7585; border: 1px solid #2d283a; padding: 4px; margin: 4px; border-radius: 3px;">
                <div style="display: flex; align-items: center; gap: 8px;">                    
                    <span><i class="fas fa-dice" style="margin: 0 3px 0 3px;"></i> Rolagem de ${dados.desc}</span>                    
                </div>
            </header>
            
            <div class="form-group" style="display: flex; flex-direction: row; gap: 20px; padding: 10px;">
    
                <div style="flex: 1; display: flex; flex-direction: column; gap: 10px; text-align: left;">

                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: bold; text-transform: uppercase; font-size: 11px;">
                        <input type="radio" name="rollMode" value="Desvantagem">
                        <i class="fas fa-dice-d20" style="color: #ff4444;"></i> Desvantagem
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: bold; text-transform: uppercase; font-size: 11px;">
                        <input type="radio" name="rollMode" value="Normal" checked>
                        <i class="fas fa-dice-d20"></i> Normal
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: bold; text-transform: uppercase; font-size: 11px;">
                        <input type="radio" name="rollMode" value="Vantagem">
                        <i class="fas fa-dice-d20" style="color: #44ff44;"></i> Vantagem
                    </label>

                </div>

                <div style="flex: 1; display: flex; flex-direction: column; gap: 10px; text-align: left; border-left: 1px solid #2d283a; padding-left: 15px;">
                    <label style="font-weight: bold; text-transform: uppercase; font-size: 11px;">
                        Modificador Extra
                    </label>
                    <input type="number" name="modificadorExtra" value="0" 
                        style="background: #1a1725; color: #fff; border: 1px solid #2d283a; border-radius: 3px; padding: 5px; text-align: center;">
                </div>    

            </div>
        </form>`;

        new Dialog({
            title: "Opções de Rolagem",
            content: content,
            buttons: {
                roll: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Rolar",
                    callback: async (html) => {
                        const mode = html.find('[name="rollMode"]:checked').val();
                        const bonus = html.find('[name="modificadorExtra"]').val();

                        let resultado = null;
                        if(dados.tipo === 'atributo') resultado = await this.executarRolagemAtributo(dados.dado, bonus, mode, dados.attr ?? 0, dados.qtd ?? 1, dados.tipo ?? '');
                        if(dados.tipo === 'arma') resultado = await this.rolagem(dados.dado, bonus, mode, dados.attr ?? 0, dados.qtd ?? 1, dados.tipo ?? '')

                        this._sendCustomChatMessage(resultado, dados.desc, dados.tipo ?? '');
                    }
                }
            },
            default: "roll",
            render: html => {
                // Estilização rápida do modal para combinar com o tema escuro
                html.closest('.app').find('.window-content').css({"background": "#0f0d15", "color": "white"});
                html.closest('.app').find('.dialog-buttons button').css({ "color": "#ffffff", "box-shadow": "none !important;"  });
            }
        }).render(true);
    }


    async _sendSimpleMsg(header, desc){
        
        const textHeader = header ? `
            <header style="display: grid; grid-template-columns: repeat(1, 1fr);  background: #1a1725; font-weight: bold; font-size: 11px; text-transform: uppercase; color: #7a7585; border: 1px solid #2d283a; padding: 4px; margin: 4px; border-radius: 3px;">
                <div style="display: flex; align-items: center; gap: 8px;">                    
                    <span><i class="fa-regular fa-circle-info" style="margin: 0 3px 0 3px;"></i> ${header}</span>                    
                </div>                
            </header>
        ` : "";

        const textContent = `
            <div class="info">
                <div class="linha" style="margin-top: 5px;"> ${desc} </div>
            </div>
        `;

        const chatContent = textHeader + textContent;

        await ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: chatContent
        });
    }

    async _sendCustomChatMessage(roll, label, tipo) {        
        //const imgPath = "systems/meu-sistema-custom/assets/d20white.png";

        const dadoCritico = roll.dieType;

        const resultados = [ roll.total ];

        const dadosHTML = resultados.map((r) => {
            let bgColor = "#333";
            //if (r === 20) bgColor = "#4b42c9";     // Sucesso 
            //else if (r === 1) bgColor = "#c0392b"; // Falha 

            return `<span style="display:inline-block;width:28px;min-width: 28px;text-align:center;margin:2px;padding:4px;background:${bgColor};border-radius:4px;color:#fff; border: 1px solid #fff;">${r}</span>`;
        }).join('');

        const botaoCriticoHTML = roll.isCritico ? `
            <div style="margin-top: 5px;">
                <button class="roll-critico" data-die="${dadoCritico}" style="background: #2a1b22; color: #ff4444; border: 1px solid #ff4444; cursor: pointer; font-size: 10px; text-transform: uppercase;">
                    <i class="fas fa-bolt"></i> Rolar Crítico
                </button>
            </div>
        ` : "";

        const msgCritico = roll.isCritico ? `
                <div class="linha" style="margin-top: 10px;">                                        
                    <span style="color:#fff"> <i class="fas fa-bolt"></i> Acerto Crítico </span>
                </div>
        ` : "";

        const botaoFailHTML = roll.isFail ? `
            <div style="margin-top: 5px;">
                <button style="background: #2a1b22; color: #ff4444; border: 1px solid #ff4444; cursor: pointer; font-size: 10px; text-transform: uppercase;" readonly>
                    <i class="fas fa-skull"></i> Falha Crítica
                </button>
            </div>
        ` : "";

        const msgAtributo = (tipo !== 'magia') ? `
            <div class="linha" style="margin-top: 5px; color: #7a7585;">
                <span><i class="fa-solid fa-layer-group"></i> Atributo: [ ${roll.attr} ]</span>
            </div>
        ` : "";

        //const resultados = [];
        //for (let i = 0; i < qtdDados; i++) {
        //    const roll = new Roll("1d6").evaluate({ async: false });
        //    resultados.push(roll.total);
        //}

        //<span class="dado">
        //  <img src="${imgPath}" style="border: none; width: 24px; height: 24px; background: none;"> 
        //  <span class="dado-value">${roll.total}</span>
        //</span>

        //fas fa-bolt  fas fa-skull

        const chatContent = `
        <div class="msg-chat-card">
                    
            <header style="display: grid; grid-template-columns: repeat(1, 1fr);  background: #1a1725; font-weight: bold; font-size: 11px; text-transform: uppercase; color: #7a7585; border: 1px solid #2d283a; padding: 4px; margin: 4px; border-radius: 3px;">
                <div style="display: flex; align-items: center; gap: 8px;">                    
                    <span><i class="fas fa-dice" style="margin: 0 3px 0 3px;"></i> Rolagem (${roll.mode})</span>                    
                </div>                
            </header>

            <div class="info">
                <div class="linha" style="margin-top: 5px;">                                        
                    ${dadosHTML}
                    <div class="critico-container" style="margin-left: -5px;"></div>
                </div>

                ${msgCritico}

                ${botaoCriticoHTML}

                ${botaoFailHTML}
                
                <hr>

                <div class="linha" style="margin-top: 5px; color: #7a7585;">    
                    <span style="min-width: 107px;"><i class="fa-solid fa-magnifying-glass"></i> Rolagem: [ ${roll.allDice.join(", ")} ]</span> 
                    <div class="critico-estatistica" style="margin-left: -5px;"></div>
                </div>  
                
                ${msgAtributo}
                
                <div class="linha" style="margin-top: 5px; color: #7a7585;">                    
                    <span><i class="fa-solid fa-calendar-plus"></i> Bonus: [ ${roll.bonus} ]</span>
                </div>   
                
            </div>

        </div>`;

        await ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: chatContent
        });
    }

    async rolagem(tipoDado, bonus, mode, attr, qtd, tipo) {
        
        const dados = [];
        const resultados = [];
        let falhaCritica = false;
        let qtdMaximos = 0; // Contador de explosões/máximos
        let qtdFinal = parseInt(qtd);

        // 1. Extrai o valor numérico do dado (ex: "d6" vira 6)
        const valorMaximoDado = parseInt(tipoDado.replace("d", ""));
        
        if (mode === "Vantagem") qtdFinal += 1;
        else if (mode === "Desvantagem") qtdFinal += 2;

        for (let i = 0; i < qtdFinal; i++) {
            const roll = new Roll(`1${tipoDado}`).evaluate({ async: false });
            const resultadoDado = roll.total;
            
            dados.push(resultadoDado);

            if (resultadoDado === valorMaximoDado) {
                qtdMaximos++;
            }
        }

        // Validação de falha crítica (primeiro dado = 1)
        if (dados[0] === 1) {
            falhaCritica = true;
        }

        // Lógica de descarte (Vantagem/Desvantagem)
        let tempResultados = [...dados];
        if (mode === "Vantagem") {
            tempResultados.sort((a, b) => a - b).shift();
        } else if (mode === "Desvantagem") {
            tempResultados.sort((a, b) => a - b).splice(-2);
        }

        resultados.push(...tempResultados);

        const somaDados = resultados.reduce((total, valor) => total + valor, 0);
        
        const valorBonus = parseInt(bonus) || 0;
        const valorAttr = parseInt(attr) || 0;
        const totalFinal = somaDados + valorBonus + valorAttr;
        
        return {
            allDice: dados,
            selectedDie: resultados,
            bonus: bonus,
            total: totalFinal,
            mode: mode,
            qtdCriticos: qtdMaximos,
            isFail: falhaCritica,
            attr: attr,
            tipoDado: tipoDado
        }
        

    }


    async executarRolagemAtributo(dieType, bonus, mode, attr, qtd, tipo) {
        
        // Pegamos o número de faces removendo o "d" da string (ex: "d20" vira 20)
        const faces = parseInt(dieType.replace("d", ""));
       
        const r1 = await new Roll(`${qtd}${dieType}`).evaluate();
        let results = [r1.total];
        let finalDieValue = r1.total;        

        if (mode !== "Normal") {
            const r2 = await new Roll(`${qtd}${dieType}`).evaluate();
            results.push(r2.total);

            if (mode === "Vantagem") {
                finalDieValue = Math.max(r1.total, r2.total);
            } else if (mode === "Desvantagem") {
                finalDieValue = Math.min(r1.total, r2.total);
            }
        }

        // Lógica que você pediu: se o dado escolhido for o valor máximo
        const isCritico = (finalDieValue === faces);

        const isFail = (finalDieValue === 1);

        let totalFinal = finalDieValue + parseInt(bonus || 0) + parseInt(attr || 0);

        if(isCritico) totalFinal = finalDieValue;
        if(isFail) totalFinal = finalDieValue;

        return {
            allDice: results,
            selectedDie: finalDieValue,
            bonus: bonus,
            total: totalFinal,
            mode: mode,
            isCritico: isCritico,
            isFail: isFail,
            attr: attr,
            dieType: dieType
        };
    }   
    
    /** @override */
    async _onDropItem(event, data) {

        const item = await Item.fromDropData(data);
        const actor = this.actor;
        
        // Se o item for uma 'spell' e o actor não for um conjurador (exemplo)
        //if (item.type === "spell" && actor.system.classe !== "mago") {
        //    return ui.notifications.warn("Apenas magos podem aprender magias!");
        //}

        if(item.type === "item" || item.type === "arma" || item.type === "armadura"){
            let items = actor.items.filter(i => i.type === "item" || i.type === "arma" || i.type === "armadura");
            if (items.length > 9) {
                return ui.notifications.error("O inventário está cheio!");
            }    
        }

        return super._onDropItem(event, data);
    }








}

class MeuItemSheet extends ItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["meu-sistema", "sheet", "item"],
            template: "systems/meu-sistema-custom/templates/item/item-sheet.html",
            width: 350,
            height: 500            
        });
    }

    getData() {
        const context = super.getData();
        context.system = context.item.system;

        context.isSpell = context.item.type === "magia";
        context.isItem = context.item.type === "item";
        context.isTalent = context.item.type === "talento";
        context.isArmadura = context.item.type === "armadura";
        context.isArma = context.item.type === "arma";
        
        return context;
    }
}

// Inicialização do Sistema
Hooks.once("init", async function() {
    console.log("Meu Sistema Customizado | Inicializando com Estilo Nimble");

    // configurar iniciativa
    CONFIG.Combat.initiative.formula = "1d20 + @attr.agi"

    // Registrar classes de Actor e Item
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("meu-sistema-custom", MeuAtorSheet, { makeDefault: true });

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("meu-sistema-custom", MeuItemSheet, { makeDefault: true });

});


Hooks.on("renderChatMessage", (message, html, data) => {
    html.find(".roll-critico").click(async (ev) => {
        ev.preventDefault();
        const button = $(ev.currentTarget);
        
        // RECUPERA O PARÂMETRO QUE SALVAMOS
        const dieType = button.data("die");    
        
        const faces = parseInt(dieType.replace("d", ""));

        // Realiza a rolagem baseada no parâmetro recuperado
        const roll = await new Roll(`1${dieType}`).evaluate();
        
        const isCritico = (roll.total === faces);

        // Toca o som
        AudioHelper.play({src: CONFIG.sounds.dice}, true);

        // Atualiza o HTML
        const novoConteudo = $("<div>").html(message.content);

        const resultados = [ roll.total ];

        const dadosHTML = resultados.map((r) => {
            let bgColor = "#333";
            //if (r === 20) bgColor = "#4b42c9";     // Sucesso 
            //else if (r === 1) bgColor = "#c0392b"; // Falha 

            return `<span style="display:inline-block;width:28px;text-align:center;margin:2px;padding:4px;background:${bgColor};border-radius:4px;color:#fff; border: 1px solid #fff;">${r}</span>`;
        }).join('');
       
        const resultadoHTML = ` ${dadosHTML}`;
        const estatisticas = ` [ ${roll.total} ]`;

        const conteudoAnterior = novoConteudo.find(".critico-container").html();
        const resultadoFinalHTML = conteudoAnterior + resultadoHTML;

        const estatisticaAnterior = novoConteudo.find(".critico-estatistica").html();
        const estatisticaFinalHTML = estatisticaAnterior + estatisticas;        


        novoConteudo.find(".critico-container").html(resultadoFinalHTML);
        novoConteudo.find(".critico-estatistica").html(estatisticaFinalHTML);
        
        if(!isCritico) novoConteudo.find(".roll-critico").remove();

        await message.update({ content: novoConteudo.html() });
    });
});

