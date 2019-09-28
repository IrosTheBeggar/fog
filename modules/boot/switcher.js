exports.boot = function (program) {
  switch (program.server) {
    case 'file':
      require("../../mstream").serveIt(program);
      break;
    case 'minecraft':
      require("./minecraft").boot(program);
      break;
    case 'bitwarden':
      require("./bitwarden").boot(program);
      break;
    default:
      throw new Error('Unknown Server');
  } 
}