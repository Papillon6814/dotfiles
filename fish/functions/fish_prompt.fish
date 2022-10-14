function fish_prompt --description 'Write out the prompt'
    printf 'papillon@%s'(fish_git_prompt)'> ' (set_color cyan)(prompt_pwd)
end

function fish_right_prompt 
    date +"%H:%M"
end
