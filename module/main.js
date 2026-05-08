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
        context.isGM = game.user.isGM;        

        this._prepareItems(context);

        return context;
    }

    _prepareItems(context) {
        const inventory = [];
        const spells = [];
        const talentos = [];
        const equippedItems = [];
        const armaduraEquipada = [];
        const escudoEquipado = [];
        const armasEquipadas = [];

        for (let i of context.items) {
            i.img = i.img || DEFAULT_TOKEN;
            if (i.type === 'item' || i.type === 'arma' || i.type === 'armadura' || i.type === 'escudo') {
                i.isItem = i.type === "item";
                i.isArma = i.type === "arma";
                i.isArmadura = i.type === "armadura";
                i.isEscudo = i.type === "escudo";

                inventory.push(i);

                if (i.system.equipped) {
                    equippedItems.push(i);

                    if(i.type === 'armadura'){
                        armaduraEquipada.push(i);
                    }

                    if(i.type === 'escudo'){
                        escudoEquipado.push(i);
                    }

                    if(i.type === 'arma'){
                        i.labelTipoAtaque = i.system.tipoAtaque === 'range' ? 'à Distância' : 'Corpo a Corpo';                        
                        armasEquipadas.push(i);
                    }
                }                

            } else if (i.type === 'magia') {
                spells.push(i);
            } else if (i.type === 'talento') {
                talentos.push(i);
            }
        }

        context.inventory = inventory;
        context.spells = spells;
        context.equippedItems = equippedItems;
        context.armaduraEquipada = armaduraEquipada;
        context.armasEquipadas = armasEquipadas;    
        context.escudoEquipado = escudoEquipado;
        context.talentos = talentos;

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

            if (item.type === "escudo" && !item.system.equipped) {
                const temOutraEscudo = this.actor.items.some(i => 
                    i.type === "escudo" && 
                    i.system.equipped === true && 
                    i.id !== item.id
                );

                if (temOutraEscudo) {
                    return ui.notifications.warn("Você já possui um escudo equipado!");
                }
            }
           
            item.update({ "system.equipped": !item.system.equipped });

            const desc = !item.system.equipped ? `Equipou: ${item.name}` : `Desequipou: ${item.name}`;

            this._sendSimpleMsg('', desc);
            await this.actor.render(false);
        });

        // Editar Item
        html.find('.item-edit').click(ev => {
            ev.stopPropagation();

            const li = $(ev.currentTarget).parents(".item-lista");
            const item = this.actor.items.get(li.data("itemId"));

            item.isSpell    = item.type === 'magia';
            item.isItem     = item.type === 'item';
            item.isTalent   = item.type === 'talento';
            item.isArma     = item.type === 'arma';
            item.isArmadura = item.type === 'armadura';
            item.isEscudo   = item.type === 'escudo';
              
            item.sheet.render(true);
        });

        // Remover Item
        html.find('.item-delete').click(async ev => {
            ev.stopPropagation();

            const li = $(ev.currentTarget).parents(".item-lista");
            const item = this.actor.items.get(li.data("itemId"));       

            item.delete();
            li.slideUp(200, () => this.render(false));
            await this.actor.render(false);
        });


        html.find('.toggle-spells').click(ev => {
            // Encontra o ancestral mais próximo com a classe 'escola-magia'
            const container = $(ev.currentTarget).closest('.escola-magia');            
            // Alterna a classe que o CSS usa para esconder/mostrar
            container.toggleClass('collapsed');
        });

        html.find('.spell-create').click(async ev => {
            ev.preventDefault();
            ev.stopPropagation(); // Impede que o clique dispare o efeito de recolher a lista

            const header = ev.currentTarget;
            const type = header.dataset.type; // Pega "spell" do data-type
            
            // Dados básicos para o novo item
            const itemData = {
                name: `Nova Magia`,
                type: type,
                img: "icons/magic/fire/flame-burning-hand-orange.webp"
            };

            // Cria o item no Actor e abre a ficha
            return await this.actor.createEmbeddedDocuments("Item", [itemData], {renderSheet: true});
        });
        
        html.find('.feature-create').click(async ev => {
            ev.preventDefault();
            ev.stopPropagation(); // Impede que o clique dispare o efeito de recolher a lista

            const header = ev.currentTarget;
            const type = header.dataset.type; // Pega "spell" do data-type
            
            // Dados básicos para o novo item
            const itemData = {
                name: `Novo Talento`,
                type: type,
                img: "icons/sundries/books/book-symbol-triangle-silver-blue.webp"
            };

            // Cria o item no Actor e abre a ficha
            return await this.actor.createEmbeddedDocuments("Item", [itemData], {renderSheet: true});
        });

        html.find(".exhaustion-check").click(this._onExhaustionClick.bind(this));        

        html.find('.roll-atributos').click(ev => { this._onRollDialog(ev); });

        html.find('.roll-arma').click(ev => { this._onRollDialog(ev); });

        html.find('.roll-magia').click(ev => { this._onRollDialog(ev); });        

        html.find('.generic-roll').click(ev => { this._onRollGenericDice(ev); });        

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

        let items = this.actor.items.filter(i => i.type === "item" || i.type === "arma" || i.type === "armadura" || i.type === "escudo");
        
        if (items.length > 9) { 
            return ui.notifications.error("O inventário está cheio!");            
        }

        const types = {
            "item": { label: "Item", icon: "fas fa-briefcase" },
            "arma": { label: "Arma", icon: "fas fa-sword" },
            "escudo": { label: "Escudo", icon: "fas fa-shield-alt" },
            "armadura": { label: "Armadura", icon: "fa-solid fa-shirt" }
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

                let imgPath = "icons/svg/item-bag.svg"; // Fallback padrão
                if (type === "arma") imgPath = "icons/weapons/swords/swords-short.webp";
                else if (type === "armadura") imgPath = "icons/equipment/chest/breastplate-scale-grey.webp";
                else if (type === "item") imgPath = "icons/containers/bags/sack-simple-leather-brown.webp";
                else if (type === "escudo") imgPath = "icons/equipment/shield/round-wooden-boss-steel-red.webp";
              

                const itemData = {
                    name: `Novo ${type.capitalize()}`,
                    type: type,
                    img: imgPath,
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


    async _onRollGenericDice(ev) {
        ev.preventDefault();

        const content = `
        <form class="roll-dialog">
            <header style="display: grid; grid-template-columns: repeat(1, 1fr); background: #1a1725; font-weight: bold; font-size: 11px; text-transform: uppercase; color: #7a7585; border: 1px solid #2d283a; padding: 4px; margin: 4px; border-radius: 3px;">
                <div style="display: flex; align-items: center; gap: 8px;">                    
                    <span><i class="fas fa-dice" style="margin: 0 3px 0 3px;"></i> Rolagem Livre</span>                    
                </div>
            </header>
            
            <div class="form-group" style="display: flex; flex-direction: row; gap: 20px; padding: 10px;">
                
                <div style="flex: 1; display: flex; flex-direction: column; gap: 10px; text-align: left;">
                    
                    <label style="font-weight: bold; text-transform: uppercase; font-size: 11px;">Tipo de Dado</label>
                    <div class="dice-type-selector" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px;">
                        ${['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map(d => `
                            <label class="type-checkbox" style="cursor: pointer; text-align: center; border: 1px solid #2d283a; padding: 5px; border-radius: 3px; background: ${d === 'd20' ? '#2d283a' : 'transparent'};">
                                <input type="radio" name="tipoDado" value="${d}" ${d === 'd20' ? 'checked' : ''} style="display: none;">
                                <span style="font-size: 12px; font-weight: bold;">${d.toUpperCase()}</span>
                            </label>
                        `).join('')}
                    </div>

                    <label style="font-weight: bold; text-transform: uppercase; font-size: 11px;">Quantidade</label>
                    <div class="dice-progress-container" style="display: flex; gap: 5px; flex-wrap: wrap;">
                        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `
                            <label class="dice-checkbox" style="cursor: pointer; font-size: 14px;">
                                <input type="checkbox" class="dice-count-check" data-index="${i}" ${i === 1 ? 'checked' : ''} style="display: none;">
                                <i class="${i === 1 ? 'fa-solid' : 'fa-regular'} fa-dice-d6"></i>
                            </label>
                        `).join('')}
                    </div>
                    
                </div>

                <div style="flex: 1; display: flex; flex-direction: column; gap: 10px; text-align: left; border-left: 1px solid #2d283a; padding-left: 15px;">
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: bold; text-transform: uppercase; font-size: 10px;">
                            <input type="radio" name="rollMode" value="Desvantagem"> <i class="fas fa-dice-d20" style="color: #ff4444;"></i> Desvantagem
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: bold; text-transform: uppercase; font-size: 10px;">
                            <input type="radio" name="rollMode" value="Normal" checked> <i class="fas fa-dice-d20"></i> Normal
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: bold; text-transform: uppercase; font-size: 10px;">
                            <input type="radio" name="rollMode" value="Vantagem"> <i class="fas fa-dice-d20" style="color: #44ff44;"></i> Vantagem
                        </label>
                    </div>
                    
                    <label style="font-weight: bold; text-transform: uppercase; font-size: 11px; margin-top: 5px;">Bônus Extra</label>
                    <input type="number" name="modificadorExtra" value="0" style="background: #1a1725; color: #fff; border: 1px solid #2d283a; border-radius: 3px; padding: 5px; text-align: center;">    
                </div>
            </div>
        </form>`;

        new Dialog({
            title: "Rolagem de Dados",
            content: content,
            buttons: {
                roll: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Rolar",
                    callback: async (html) => {
                        const tipoDado = html.find('[name="tipoDado"]:checked').val();
                        const mode = html.find('[name="rollMode"]:checked').val();   
                        const bonusExtra = parseInt(html.find('[name="modificadorExtra"]').val()) || 0;
                        const qtdDados = html.find('.dice-count-check:checked').length || 1;

                        let resultado = await this.rolagem(tipoDado, bonusExtra, mode, 0, qtdDados, 'generico', 0);    
                        this._sendCustomChatMessage(resultado, `Rolagem Livre`, 'generico', 0);
                    }
                }
            },
            default: "roll",
            render: html => {                
                html.closest('.app').find('.window-content').css({"background": "#0f0d15", "color": "white"});
                
                // LÓGICA 1: Seleção de Tipo de Dado (Exclusivo)
                html.find('.type-checkbox').on('click', function() {
                    html.find('.type-checkbox').css('background', 'transparent');
                    $(this).css('background', '#2d283a');
                    $(this).find('input').prop('checked', true);
                });

                // LÓGICA 2: Seleção de Quantidade (Acumulativo)
                html.find('.dice-checkbox').on('click', function() {
                    const clickedIndex = parseInt($(this).find('input').data('index'));
                    const container = $(this).closest('.dice-progress-container');
                    const currentCount = container.find('.dice-count-check:checked').length;
                    
                    let newCount = (clickedIndex === currentCount) ? clickedIndex - 1 : clickedIndex;
                    if (newCount < 1) newCount = 1;

                    container.find('.dice-checkbox').each(function() {
                        const input = $(this).find('input');
                        const idx = parseInt(input.data('index'));
                        const shouldBeChecked = idx <= newCount;
                        input.prop('checked', shouldBeChecked);
                        $(this).find('i').attr('class', shouldBeChecked ? 'fa-solid fa-dice-d6' : 'fa-regular fa-dice-d6');
                    });
                });
            }
        }, { width: 480 }).render(true);
    }


    async _onRollDialog(ev) {

        ev.preventDefault();
        
        //evita chamar quando clicar no input
        if (ev.target.tagName === "INPUT") return;

        const element = $(ev.currentTarget);
        const dados = event.currentTarget.dataset;
      
        //const label = element.find('label').text();
        //const attr = element.find('.roll-value').val();
        //console.log('---');
        //console.log(dados);  
        //console.log(dados.desc);  
        //console.log(dados.attr);  
        //console.log(this.actor.system);
        //console.log(this.actor.items);
        //console.log(dados);       

        if(dados.tipo === 'arma'){
            dados.attr = (dados.tipoataque === 'range') ? this.actor.system.attr.agi : this.actor.system.attr.str;
        }     
        
        let bonusBase = parseInt(dados.bonus) || 0;
        if(dados.tipo === 'armadura'){
            const itemEscudo = this.actor.items.find(i => i.type === "escudo" && i.system.equipped === true);
            if (itemEscudo) {              
                const defesaEscudo = parseInt(itemEscudo.system.defesa) || 0;
                // Somamos na nossa variável local, sem mexer no 'dados.bonus' original do HTML
                bonusBase += defesaEscudo;
            }
        }
     

        let currentExtra = this.document.system.extraDice || 0;

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
                                        
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 10px; text-align: left;">
                        <label style="font-weight: bold; text-transform: uppercase; font-size: 11px;">Dado Extra</label>
                        
                        <div class="dice-progress-container" style="display: flex; gap: 5px;">
                            ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `
                                <label class="dice-checkbox" style="cursor: pointer; font-size: 14px;">
                                    <input type="checkbox" class="dice-count-check" data-index="${i}" ${currentExtra >= i ? 'checked' : ''} style="display: none;">
                                    <i class="${currentExtra >= i ? 'fa-solid' : 'fa-regular'} fa-dice-d6"></i>
                                </label>
                            `).join('')}
                        </div>
                        
                    </div>
                   
                    

                    
                    <label style="font-weight: bold; text-transform: uppercase; font-size: 11px;">
                        Modificador Bonus Extra
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
                        const extraDigitado = parseInt(html.find('[name="modificadorExtra"]').val()) || 0;
                        const totalBonus = bonusBase + extraDigitado;

                        const dadosExtras = html.find('.dice-count-check:checked').length;                  

                        let resultado = await this.rolagem(dados.dado, totalBonus, mode, dados.attr ?? 0, dados.qtd ?? 1, dados.tipo ?? '', dadosExtras ?? 0);    

                        this._sendCustomChatMessage(resultado, dados.desc, dados.tipo ?? '', dadosExtras ?? 0);
                    }
                }
            },
            default: "roll",
            render: html => {                
                html.closest('.app').find('.window-content').css({"background": "#0f0d15", "color": "white"});
                html.closest('.app').find('.dialog-buttons button').css({ "color": "#ffffff", "box-shadow": "none !important;"  });


                html.find('.dice-checkbox').on('click', function(event) {
                    const checkbox = $(this).find('input');
                    const clickedIndex = parseInt(checkbox.data('index'));
                    const container = $(this).closest('.dice-progress-container');
                    
                    // Verifica quantos estão marcados atualmente
                    const currentCount = container.find('.dice-count-check:checked').length;
                    
                    let newCount;

                    // SE o índice clicado for igual ao que já está marcado, ele desmarca um nível
                    // Ex: Clicou no 3 e tem 3 marcados -> vira 2.
                    // Ex: Clicou no 1 e tem 1 marcado -> vira 0.
                    if (clickedIndex === currentCount) {
                        newCount = clickedIndex - 1;
                    } else {
                        // Caso contrário, marca até o que foi clicado
                        newCount = clickedIndex;
                    }

                    // Aplica a atualização visual em todos os ícones do grupo
                    container.find('.dice-checkbox').each(function() {
                        const input = $(this).find('input');
                        const idx = parseInt(input.data('index'));
                        const shouldBeChecked = idx <= newCount;
                        
                        input.prop('checked', shouldBeChecked);
                        
                        const icon = $(this).find('i');
                        if (shouldBeChecked) {
                            icon.removeClass('fa-regular').addClass('fa-solid');
                        } else {
                            icon.removeClass('fa-solid').addClass('fa-regular');
                        }
                    });
                });

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

    async _sendCustomChatMessage(roll, label, tipo, dadosExtras) {        
        //const imgPath = "systems/meu-sistema-custom/assets/d20white.png";

        const acertoCritico = roll.acertoCritico;
        const resultados = roll.selectedDie;
        const tipoDado = roll.tipoDado;
        const valorMaximoDado = roll.valorMaximoDado;
        const isFail = roll.isFail;
        const qtdDado = roll.qtdDado;

        
        
        const dadosHTML = resultados.map((r, index) => {
            let bgColor = "#333";
            
            if (index === 0 && r === 1 && isFail) bgColor = "#c0392b"; 
            if (index === 0 && r === valorMaximoDado && acertoCritico) bgColor = "#2980b9"; 

            //if (r === 20) bgColor = "#4b42c9";     // Sucesso 
            //else if (r === 1) bgColor = "#c0392b"; // Falha 

            return `<span style="display:inline-block;width:28px;min-width: 28px;text-align:center;margin:2px;padding:4px;background:${bgColor};border-radius:4px;color:#fff; border: 1px solid #fff;">${r}</span>`;
        }).join('');

        let botoesCriticoHTML = "";
        let botaoFailHTML = ""
        let msgCritico = "";   
        
        
        if(isFail){

            botaoFailHTML =  `
                <div style="margin-top: 5px;">
                    <button style="background: #2a1b22; color: #ff4444; border: 1px solid #ff4444; cursor: pointer; font-size: 10px; text-transform: uppercase;" readonly>
                        <i class="fas fa-skull"></i> Falha Crítica
                    </button>
                </div>
            `;

        } else if (acertoCritico) {

            msgCritico = `
                <div class="linha" style="margin-top: 10px;">                                        
                    <span style="color:#e2d9c3"> <i class="fas fa-bolt"></i> Acerto Crítico </span>
                </div>
            `;
            
            botoesCriticoHTML += `
                <div style="margin-top: 5px;">
                    <button class="roll-critico" data-die="${tipoDado}" data-indice="0" 
                            style="background: #2a1b22; color: #ff4444; border: 1px solid #ff4444; cursor: pointer; font-size: 10px; text-transform: uppercase; width: 100%;">
                        <i class="fas fa-bolt"></i> Rolar Crítico
                    </button>
                </div>
            `;            

            if ("Sorrateiro" === this.actor.system.classe && roll.tipo === 'arma'){
                 const extraDado = this.actor.system.dado_extra || 1;

                for (let i = 1; i <= extraDado; i++) {
                    botoesCriticoHTML += `
                        <div style="margin-top: 5px;">
                            <button class="roll-critico" 
                                    data-die="${tipoDado}" 
                                    data-indice="${i}" 
                                    style="background: #2a1b22; color: #ff4444; border: 1px solid #ff4444; cursor: pointer; font-size: 10px; text-transform: uppercase; width: 100%;">
                                <i class="fas fa-bolt"></i> Rolar Sneak Attack ${i}
                            </button>
                        </div>
                    `;
                }
            }
                        
        }

        const msgAtributo = (tipo !== 'magia') ? `
            <div class="linha" style="margin-top: 5px; color: #7a7585;">
                <span><i class="fa-solid fa-layer-group"></i>Atributo: ${roll.attr}</span>
            </div>
        ` : "";

        const msgAtributo2 = (tipo !== 'magia') ? `+ Atributo: ${roll.attr})`: ")";


        const msgTotal = `
            <div class="linha" style="margin-top: 10px;">                                        
                <span style="color:#e2d9c3">Total: </span>
                <span class="total" style="color:#e2d9c3; margin-left: -3px"> ${roll.total} </span>
            
                <span style="color: #7a7585; font-size:12px; margin-left: -3px"> (Dados: </span>
                <span class="dadosRolados" style="color: #7a7585; font-size:12px; margin-left: -7px;"> ${roll.somaDados} </span>
                <span style="color: #7a7585; font-size:12px;margin-left: -7px;"> + Bonus: ${roll.bonus} ${msgAtributo2} </span>
            </div> 
        `;

        const msgDadoExtra = parseInt(dadosExtras) > 0 ? ` + ${dadosExtras}${roll.tipoDado}` : ``;

        const chatContent = `
        <div class="msg-chat-card">

           
                    
            <header style="display: grid; grid-template-columns: repeat(1, 1fr);  background: #1a1725; font-weight: bold; font-size: 11px; text-transform: uppercase; color: #7a7585; border: 1px solid #2d283a; padding: 4px; margin: 4px; border-radius: 3px;">
                <div style="display: flex; align-items: center; gap: 8px;">                    
                    <span style="margin: 0 3px 0 3px;color: #e2d9c3; font-weight: normal; "> ${label}</span><span><i class="fas fa-dice" style="margin: 0 3px 0 3px;"></i> ${qtdDado}${roll.tipoDado} ${msgDadoExtra} (${roll.mode})</span>                    
                </div>                
            </header>

            <div class="info">
                <div class="linha" style="display: flex; flex-wrap: wrap; gap: 4px; align-items: center; margin-top: 5px;">                                        
                    ${dadosHTML}
                    <div class="critico-container"style="display: flex; gap: 4px;"></div>
                </div>

                ${msgCritico}
                
                ${msgTotal}

                ${botoesCriticoHTML}

                ${botaoFailHTML}
                
                <hr>

                <div class="linha" style="margin-top: 5px; color: #7a7585; display: flex; flex-wrap: wrap; align-items: center; gap: 4px;">    
                    <span style="min-width: 107px;"><i class="fa-solid fa-magnifying-glass"></i> Rolagem: [ ${roll.allDice.join(", ")} ]</span> 
                    <div class="critico-estatistica" style="display: flex; gap: 4px; align-items: center;"></div>
                </div>  
                
            </div>

        </div>`;

        await ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: chatContent
        });
    }

    async rolagem(tipoDado, bonus, mode, attr, qtd, tipo, dadosExtras) {
        const dados = [];
        let falhaCritica = false;
        let acertoCritico = false;
        let qtdFinal = parseInt(qtd) + parseInt(dadosExtras);

        const valorMaximoDado = parseInt(tipoDado.replace("d", ""));        
        
        if (mode === "Vantagem") qtdFinal += 1;
        else if (mode === "Desvantagem") qtdFinal += 2;
        
        for (let i = 0; i < qtdFinal; i++) {
            const roll = new Roll(`1${tipoDado}`).evaluate({ async: false });
            const resultadoDado = roll.total;            
            dados.push(resultadoDado);            
        }

        // 2. Lógica de Descarte mantendo a ORDEM ORIGINAL
        let resultados = [...dados]; // Começamos com uma cópia integral

        if (mode === "Vantagem") {
            // Encontra o índice do menor valor e remove apenas ele
            const menorValor = Math.min(...resultados);
            const indiceMenor = resultados.indexOf(menorValor);
            resultados.splice(indiceMenor, 1); 
        } 
        else if (mode === "Desvantagem") {
            // Remove os dois maiores valores, um por um, mantendo a ordem dos que sobrarem
            for (let j = 0; j < 2; j++) {
                const maiorValor = Math.max(...resultados);
                const indiceMaior = resultados.indexOf(maiorValor);
                resultados.splice(indiceMaior, 1);
            }
        }

        if (resultados[0] === 1) falhaCritica = true;            
        if (resultados[0] === valorMaximoDado) acertoCritico = true;            

        // 3. Cálculos Finais
        const somaDados = resultados.reduce((total, valor) => total + valor, 0);
        const valorBonus = parseInt(bonus) || 0;
        const valorAttr = parseInt(attr) || 0;
        const totalFinal = somaDados + valorBonus + valorAttr;
        
        return {
            allDice: dados,        
            selectedDie: resultados, 
            bonus: valorBonus,
            total: totalFinal,
            mode: mode,
            qtdDado: qtd,
            acertoCritico: acertoCritico,
            isFail: falhaCritica,
            attr: valorAttr,
            somaDados: somaDados,
            valorMaximoDado: valorMaximoDado,
            tipo: tipo,
            tipoDado: tipoDado
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

        if(item.type === "item" || item.type === "arma" || item.type === "armadura" || item.type === "escudo"){
            let items = actor.items.filter(i => i.type === "item" || i.type === "arma" || i.type === "armadura" || i.type === "escudo");
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
            height: 530            
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
        context.isEscudo = context.item.type === "escudo";
        context.isGM = game.user.isGM;

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

        const totalAnterior = parseInt(novoConteudo.find(".total").text()) || 0;        
        const novoTotalFinal = totalAnterior + roll.total;        
        novoConteudo.find(".total").text(novoTotalFinal);

        const totalDadosRoladoAnterior = parseInt(novoConteudo.find(".dadosRolados").text()) || 0;        
        const novoDadosRoladosTotalFinal = totalDadosRoladoAnterior + roll.total; 
        novoConteudo.find(".dadosRolados").text(novoDadosRoladosTotalFinal);  

        const resultados = [ roll.total ];

        const dadosHTML = resultados.map((r) => {
            let bgColor = "#333";
            if (r === faces) bgColor = "#2980b9";               

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
        
        // 1. Pega o índice do botão que foi clicado
        const indiceClicado = button.data("indice");

        // 2. Atualiza os textos/containers no seu objeto temporário
        novoConteudo.find(".critico-container").html(resultadoFinalHTML);
        novoConteudo.find(".critico-estatistica").html(estatisticaFinalHTML);
        
        // 3. REMOÇÃO LÓGICA: Se não gerou um novo crítico, remove o botão específico de dentro do novoConteudo
        if (!isCritico) {
            // Procuramos o botão pelo índice dentro do HTML que será salvo
            const botaoNoTemplate = novoConteudo.find(`.roll-critico[data-indice="${indiceClicado}"]`);
            botaoNoTemplate.parent().remove(); 
        }

        // 4. Agora sim, atualiza a mensagem com o HTML que já teve o botão removido
        await message.update({ content: novoConteudo.html() });
    });
});

