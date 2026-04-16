function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.data,
      data.nome,
      data.email,
      data.telefone,
      data.crmv,
      data.estado,
      data.especialidade,
      data.clinica,
      data.cidade,
      data.uf,
      'Pendente'
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'success',
      'message': 'Dados salvos com sucesso'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    // Se não tem parâmetros, retorna mensagem de teste
    if (!e.parameter || Object.keys(e.parameter).length === 0) {
      return ContentService.createTextOutput("Google Apps Script funcionando!");
    }
    
    // Recebe dados via GET
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = e.parameter;
    
    sheet.appendRow([
      data.data || new Date().toLocaleString('pt-BR'),
      data.nome || '',
      data.email || '',
      data.telefone || '',
      data.crmv || '',
      data.estado || '',
      data.especialidade || 'Não informada',
      data.clinica || 'Não informada',
      data.cidade || '',
      data.uf || '',
      'Pendente'
    ]);
    
    // Retorna imagem transparente de 1x1 pixel (GIF)
    return ContentService.createTextOutput("GIF89a\x01\x00\x01\x00\x80\x00\x00\xFF\xFF\xFF\x00\x00\x00!\xF9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;")
      .setMimeType(ContentService.MimeType.GIF);
    
  } catch(error) {
    Logger.log('Erro: ' + error.toString());
    return ContentService.createTextOutput("GIF89a\x01\x00\x01\x00\x80\x00\x00\xFF\xFF\xFF\x00\x00\x00!\xF9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;")
      .setMimeType(ContentService.MimeType.GIF);
  }
}
