
STDOUT.sync = true
BASE_DIR = File.dirname(__FILE__)

EXTENSION_DIR = File.join(BASE_DIR, "extension")

IMAGE_CSS_FILES = ["extension/libs/jquery-ui-1.10.3/themes/base/jquery-ui.css"]

task :default => [:package]

EXTENSION_ID = ENV["STYLE_ADJUSTER_CHROME_EXTENSION_ID"] || "__MSG_@@extension_id__"

CHROME_EXTENSION_URL_PREFIX = "chrome-extension://#{EXTENSION_ID}/"

task :chrome_extension_css do
  puts "CHROME_EXTENSION_URL_PREFIX = #{CHROME_EXTENSION_URL_PREFIX}"
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

BUILD_DIR = File.join(BASE_DIR, "build");
BUILD_EXTENSION_DIR = File.join(BASE_DIR, "build/extension");

task :package => [:chrome_extension_css] do
  FileUtils.rm_r BUILD_DIR, :verbose => true
  FileUtils.mkdir_p BUILD_DIR, :verbose => true
  FileUtils.cp_r EXTENSION_DIR, BUILD_DIR, :verbose => true
  Dir.glob(File.join(BUILD_EXTENSION_DIR, "*.scss")) do |file|
    FileUtils.rm file, :verbose => true
  end
  FileUtils.rm File.join(BUILD_EXTENSION_DIR, "libs/jquery-ui-1.10.3/themes/base/jquery-ui.css"), :verbose => true
end


