//
//  TodoViewModel.swift
//  BootcampLearning
//
//  Created by ABHINAV ANAND  on 31/01/25.
//


import Foundation
import SwiftUI


class TodoViewModel: ObservableObject {
    @Published var todos: [ToDo] {
        didSet {
            saveTodos()
        }
    }

    init() {
        self.todos = UserDefaults.standard.load()
    }

    func addTodo(title: String) {
        let newTodo = ToDo(title: title)
        todos.append(newTodo)
    }

    func removeTodo(at indexSet: IndexSet) {
        todos.remove(atOffsets: indexSet)
    }

    func toggleCompletion(for todo: ToDo) {
        if let index = todos.firstIndex(where: { $0.id == todo.id }) {
            withAnimation {
                todos[index].isCompleted.toggle()
            }
        }
    }

    private func saveTodos() {
        if let encoded = try? JSONEncoder().encode(todos) {
            UserDefaults.standard.set(encoded, forKey: "todos")
        }
    }
}

extension UserDefaults {
    func load() -> [ToDo] {
        if let data = data(forKey: "todos"), let decoded = try? JSONDecoder().decode([ToDo].self, from: data) {
            return decoded
        }
        return []
    }
}
