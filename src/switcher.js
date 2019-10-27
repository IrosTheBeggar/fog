exports.boot = function (program) {
  // Handle DDNS Here

  switch (program.server) {
    case 'file':
      require("../servers/file-server/server").boot(program);
      break;
    case 'minecraft':
      require("./boot/minecraft").boot(program);
      break;
    case 'bitwarden':
      require("./boot/bitwarden").boot(program);
      break;
    case 'terraria':
        require("./boot/terraria").boot(program);
        break;
    default:
      throw new Error('Unknown Server');
  } 
}