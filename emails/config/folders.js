let input = new Object();
input.base = 'src';
input.pages = input.base + '/pages';
input.styles = input.base + '/styles';
input.scripts = input.base + '/scripts';
input.images = input.base + '/images';
input.fonts = input.base + '/fonts';

let template = new Object();
template.name = '';
template.folder = 'templates';

let output = new Object();
output.base = '../email-templates';
output.pages = '';
output.styles = template.folder + '/css';
output.scripts = template.folder + '/js';
output.images = template.folder + '/images';
output.fonts = template.folder + '/fonts';



module.exports = {
  'input': input,
  'output': output,
  'template': template
};