function fish_prompt --description 'Write out the prompt'
    printf 'papillon@%s%s> ' (set_color cyan) $PWD (fish_git_prompt)
end

function fish_right_prompt 
    date +"%H:%M"
end
