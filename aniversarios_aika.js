/**
 * Otimiza FarmaVet - Despertador de Aniversários da Aika 🐾
 * Este script verifica os aniversariantes do dia na planilha ativa
 * e envia um e-mail para o administrador com um link do WhatsApp
 * pré-preenchido com uma mensagem de parabéns da mascote Aika.
 */

function verificarAniversarios() {
  // Pega a aba ativa da planilha atual
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  // Data de hoje
  var hoje = new Date();
  var diaHoje = hoje.getDate();
  var mesHoje = hoje.getMonth(); 
  
  // E-mail do administrador que vai receber o alerta
  // Por padrao, envia para quem estiver executando o script
  var emailAdmin = Session.getActiveUser().getEmail(); 
  // var emailAdmin = "admin@otimizafarmavet.com"; // Descomente e altere para forçar um e-mail específico
  
  // Começa do índice 1 para ignorar o cabeçalho
  for (var i = 1; i < data.length; i++) { 
    var telefone = data[i][0];
    var nomeTutor = data[i][1];
    var dataNasc = data[i][2];
    
    // Pula linhas totalmente vazias
    if (!nomeTutor && !telefone) continue;
    
    var diaNasc = null;
    var mesNasc = null;
    
    // Tenta entender se a data já é um objeto pronto do Google
    if (Object.prototype.toString.call(dataNasc) === '[object Date]' && !isNaN(dataNasc)) {
      diaNasc = dataNasc.getDate();
      mesNasc = dataNasc.getMonth();
    } 
    // Tenta entender se a data foi digitada como texto (ex: "22/10/1978")
    else if (typeof dataNasc === 'string' && dataNasc.indexOf('/') !== -1) {
      var partesData = dataNasc.split('/'); // Divide nos pedaços: "22", "10", "1978"
      if (partesData.length >= 2) {
        diaNasc = parseInt(partesData[0], 10);
        mesNasc = parseInt(partesData[1], 10) - 1; // Mês no JavaScript começa do zero (Janeiro = 0)
      }
    }
    
    // Se a gente conseguiu ler o dia e o mês, faz a verificação do aniversário
    if (diaNasc !== null && mesNasc !== null && !isNaN(diaNasc) && !isNaN(mesNasc)) {
      Logger.log("Verificando tutor: " + nomeTutor + " | Nasc: " + diaNasc + "/" + (mesNasc+1) + " | Hoje: " + diaHoje + "/" + (mesHoje+1));
      
      // Se for aniversário hoje
      if (diaHoje === diaNasc && mesHoje === mesNasc) {
        Logger.log("=> Aniversário encontrado! Enviando e-mail para o tutor: " + nomeTutor);
        enviarAlertaAniversario(telefone, nomeTutor, emailAdmin);
      }
    } else {
      Logger.log("⚠️ ATENÇÃO: A data do tutor " + nomeTutor + " não pôde ser interpretada. Valor lido da planilha: " + dataNasc);
    }
  }
}

function enviarAlertaAniversario(telefone, nomeTutor, emailAdmin) {
  // Garantir que o telefone só tem números
  var telefoneLimpo = String(telefone).replace(/\D/g, '');
  
  // Copy atualizada - Alinhada com a automação original da Otimiza FarmaVet
  var mensagemWhats = "Olá, " + nomeTutor + "! 🐾 Aqui é a Aika da Otimiza FarmaVet!\n\n" +
                      "Passando para te desejar um aniversário incrível e cheio de alegria! 🎉\n\n" +
                      "Para comemorar, preparei um presente: **15% OFF** em todo o nosso site para você e seu pet! 🎁\n\n" +
                      "Resgate seu desconto aqui: https://otimizafarmavet.com.br/discount/Aniver_Best_tutor?utm_campaign=11ce79&utm_source=discount_shareable_link\n\n" +
                      "Aproveite seu dia! 🦴🎂";
  
  // Formatar o link do WhatsApp
  var mensagemCodificada = encodeURIComponent(mensagemWhats);
  var linkWhatsapp = "https://wa.me/" + telefoneLimpo + "?text=" + mensagemCodificada;
  
  // Regras do E-mail
  var assunto = "[Lembrete] Aniversario Hoje: " + nomeTutor;
  
  var corpoHtml = "<h2>Alerta de Aniversariante Identificado</h2>" +
                  "<p>Ola Equipe Otimiza FarmaVet,</p>" +
                  "<p>Hoje e o aniversario do(a) tutor(a) <strong>" + nomeTutor + "</strong>!</p>" +
                  "<p>O presente ja foi estruturado. O link do WhatsApp com a mensagem corporativa da Otimiza esta pronto para envio com apenas um clique:</p>" +
                  "<p style='margin-top: 20px; margin-bottom: 20px;'>" +
                  "<a href='" + linkWhatsapp + "' style='background-color:#25D366;color:white;padding:12px 24px;text-decoration:none;border-radius:10px;font-weight:bold;font-size:16px;'>Enviar Mensagem via WhatsApp</a></p>" +
                  "<p><em>Caso o botao nao funcione, use este link direto: <br><a href='" + linkWhatsapp + "'>" + linkWhatsapp + "</a></em></p>" +
                  "<br><p>Notificacao enviada pelo,<br><strong>Sistema Google Sheets</strong></p>";
                  
  // Envio do E-mail
  MailApp.sendEmail({
    to: emailAdmin,
    subject: assunto,
    htmlBody: corpoHtml
  });
}

/**
 * Função apenas para testes manuais.
 * Execute esta função para receber uma notificação de mentirinha
 * e ver exatamente como chega no e-mail com a copy da Aika.
 */
function testarEnvio() {
  var emailTeste = Session.getActiveUser().getEmail();
  
  // Você pode alterar esse número para o seu celular temporariamente se quiser testar o link real!
  var telefoneTeste = "5511999999999"; 
  var nomeTeste = "Tutor de Teste";
  
  enviarAlertaAniversario(telefoneTeste, nomeTeste, emailTeste);
}
