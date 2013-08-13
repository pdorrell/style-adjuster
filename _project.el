;; Project values

(load-this-project
 `(
   (:search-extensions (".js" ".html" ".css" ".scss"))
   (:main-html-file "index.html")
   (:compile-command ,"rake")
   (:build-function project-compile-with-command)
   (:run-project-command (browse-in-dev-browser (project-file :main-html-file)))
   (:sass-watch-src-output-argument ,(concat (project-base-directory)))
    ) )
