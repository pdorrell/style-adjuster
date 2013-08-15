
STDOUT.sync = true
BASE_DIR = File.dirname(__FILE__)

EXTENSION_BUILD_DIR = File.join(BASE_DIR, "build/extension")

IMAGE_CSS_FILES = ["js/jquery-ui-1.10.3/themes/base/jquery-ui.css"]

task :default => [:chrome_extension]

CHROME_EXTENSION_URL_PREFIX = "chrome-extension://__MSG_@@extension_id__/"

task :chrome_extension_css do
  for css_file in IMAGE_CSS_FILES do
    css_file_relative_dir = 'base'
    puts "css_file_relative_dir = #{css_file_relative_dir}"
    css_file_name = File.join(BASE_DIR, css_file)
    puts "Reading CSS file #{css_file_name} ..."
    puts "css_file_name = #{css_file_name}"
    css_out_file_name = css_file_name[0...-4] + ".extension.css"
    puts "css_out_file_name = #{css_out_file_name}"
    css_content = File.read(css_file_name)
    url_prefix = "#{CHROME_EXTENSION_URL_PREFIX}#{css_file_relative_dir}/"
    new_css_content = css_content.gsub("url(\"images", "url(\"#{url_prefix}images")
    new_css_content = new_css_content.gsub("url(images", "url(#{url_prefix}images")
    File.open(css_out_file_name, "w") do |f|
      f.write(new_css_content)
    end
    puts " wrote Chrome extension CSS to #{css_out_file_name}"
  end
end

directory EXTENSION_BUILD_DIR

EXTENSION_SRC_FILES = Dir.chdir(BASE_DIR) do
  Dir.glob %w' manifest.json
               start-style-adjuster.js
               load-style-adjuster-for-extension.js
               lib/style-adjuster.js
               lib/style-adjuster.css
               lib/rule-prechecker.css
               lib/help.html
               js/jquery-1.10.2.js
               js/jquery-ui-1.10.3/jquery-ui.js
               js/jquery-ui-1.10.3/themes/base
             '
end

task :chrome_extension => [EXTENSION_BUILD_DIR, :chrome_extension_css] do
  FileUtils.cp_r EXTENSION_SRC_FILES, EXTENSION_BUILD_DIR, :verbose => true
end

task :clean do
  FileUtils.rm_r EXTENSION_BUILD_DIR, :verbose => true
end

